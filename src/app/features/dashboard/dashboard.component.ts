import { Component } from '@angular/core';

import { AgentProfileService } from '../../services/agent-profile/agent.profile.service';


import { AgentSidebarComponent } from '../sidebar/agent-sidebar/agent-sidebar.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';


interface Ticket {
  id: number;
  title: string;
  date: string;
  priority: 'Low' | 'Medium' | 'High';
  description: string;
  status: 'Open' | 'Pending' | 'Resolved';
}

@Component({
  selector: 'app-dashboard',

  imports: [CommonModule, AgentSidebarComponent],

  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  adminName: string = '';

  tickets: Ticket[] = [
    {
      id: 1,
      title: 'Wireless headphones not connecting',
      date: '7/16/2023',
      priority: 'Medium',
      description:
        "I bought the headphones last week and they won't connect to my phone.",
      status: 'Open',
    },
    {
      id: 2,
      title: 'Request for refund',
      date: '7/21/2023',
      priority: 'High',
      description: 'I would like to return my smart watch and get a refund.',
      status: 'Pending',
    },
  ];

  statistics: any = null;
  loading = true;
  error: string | null = null;

  


  constructor(private http: HttpClient,private agentProfileService:AgentProfileService) {}

  ngOnInit(): void {
    this.loadAdminProfile(),
     this.fetchStatistics();
  }

private loadAdminProfile():void{
  const userAccessToken = localStorage.getItem('token') ?? '';
  this.agentProfileService.getProfile(userAccessToken).pipe().subscribe({
   
    next: (profile) => {
      // Handle the profile data here
      console.log('Profile loaded:', profile);
      this.adminName=profile.name
    },
    error: (error) => {
      console.error('Error loading profile:', error);
    }
  });
}


  

  fetchStatistics() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    this.http
      .get('http://localhost:3000/admin/dashboard/statistics', { headers })
      .subscribe({
        next: (res: any) => {
          console.log(res);
          
          this.statistics = res.statistics;
          this.loading = false;
          console.log('Statistics:', this.statistics);
        },
        error: (err) => {
          this.error = 'Failed to load statistics. Please try again later.';
          this.loading = false;
          console.error('Error fetching statistics:', err);
        },
      });

  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
