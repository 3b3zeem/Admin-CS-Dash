import { TicketUpdate } from './../../interfaces/tkt.interface';
import {
  Component,
  EventEmitter,
  NgModule,
  OnInit,
  Output,
} from '@angular/core';
import { TktServiceService } from '../../services/tickets/tkt-service.service';
import { Ticket } from '../../interfaces/tkt.interface';
import { CommonModule } from '@angular/common';
import { EditTicketFormComponent } from '../tickets/edit-ticket-form/edit-ticket-form.component';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tickets-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets-table.component.html',
  styleUrl: './tickets-table.component.css',
})
export class TicketsTableComponent implements OnInit {
  protected Math = Math;
  @Output() selectTicket = new EventEmitter<Ticket>();
  tickets: Ticket[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  selectedTicket: Ticket | null = null;
  searchQuery: string = '';
  filteredTickets: Ticket[] = [];
  currentPage: number = 1;
  pageSize: number = 5;
  intervalId: any;
  constructor(
    private tktService: TktServiceService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.getTickets();
    this.intervalId = setInterval(() => this.getTickets(), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  getTickets() {
    this.isLoading = true;
    this.error = null;
    const token = localStorage.getItem('token') || '';
    this.tktService.getTickets(token).subscribe({
      next: (response: Ticket[]) => {
        this.tickets = response.map((ticket) => ({
          ...ticket,
          isLoading: false,
          name: ticket.agent?.name || 'Unassigned Yet',
        }));

        this.filteredTickets = [...this.tickets];
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Error fetching tickets. Please try again later.';
        this.isLoading = false;
      },
    });
  }

  get PaginatedTickets() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredTickets.slice(startIndex, endIndex);
  }

  get totalPages() {
    return Math.ceil(this.filteredTickets.length / this.pageSize);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  searchTickets(query: string) {
    this.searchQuery = query;
    if (!query.trim) {
      this.filteredTickets = [...this.tickets];
      return;
    }

    this.filteredTickets = this.tickets.filter((ticket) =>
      ticket.title?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  updateTicketInTable(updatedTicket: Ticket) {
    this.tickets = this.tickets.map((ticket) =>
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    );
    this.filteredTickets = this.filteredTickets.map((ticket) =>
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    );
    this.selectedTicket = null;
  }

  onTicketSelect(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.selectTicket.emit(ticket);
  }

  updateTicketStatus(ticket: Ticket, newStatus: string) {
    const originalStatus = ticket.status;

    if (newStatus === originalStatus) {
      this.toastr.warning('No changes detected.', 'Warning');
      return;
    }

    this.tktService.updateTicketStatus(ticket.id, newStatus).subscribe({
      next: (updatedTicket: Ticket) => {
        this.toastr.success('Ticket status updated successfully!', 'Success');
        this.updateTicketInTable(updatedTicket);
      },
      error: (err) => {
        const errorMessage =
          err.error?.message || 'Error updating ticket status';
        this.toastr.error(errorMessage, 'Error');
        ticket.status = originalStatus;
      },
    });
  }

  deleteTickets(ticket: Ticket) {
    const token = localStorage.getItem('token') || '';

    this.tktService.deleteTicket(ticket.id, token).subscribe({
      next: () => {
        this.tickets = this.tickets.filter((t) => t.id !== ticket.id);
        this.filteredTickets = this.filteredTickets.filter(
          (t) => t.id !== ticket.id
        );

        this.toastr.success('Ticket deleted successfully!', 'Success');
      },
      error: (err) => {
        console.error('Error deleting ticket:', err);
        this.toastr.error(
          'Failed to delete ticket. Please try again.',
          'Error'
        );
      },
    });
  }
}
