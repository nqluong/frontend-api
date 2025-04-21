import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../services/account.service'; // Make sure the path is correct
import { Account } from '../../services/account.service'; // Import the Account interface
import { FormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-all-account',
  imports: [CommonModule, FormsModule, HttpClientModule],
  standalone: true,
  templateUrl: './all-account.component.html',
  styleUrls: ['./all-account.component.css']
})
export class AllAccountComponent implements OnInit {
  accounts: Account[] = [];
  selectedAccount: Account | null = null;
  newAccount: Account = {
    email: '',
    username: '',
    password: '',
    sdt: '',
    role: '',
    provider: '',
    providerId: ''
  };

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.accountService.getAccounts().subscribe(
      (response) => {
        if (response.status === 200) {
          this.accounts = response.result;
        } else {
          console.error('Error fetching accounts:', response.message);
        }
      },
      (error) => {
        console.error('Error occurred:', error);
      }
    );
  }

  // Add Account
  addAccount(): void {
    this.accountService.addAccount(this.newAccount).subscribe(
      (response) => {
        if (response.status === 200) {
          this.accounts.push(response.result);  // Add the new account to the list
          this.newAccount = {
            email: '',
            username: '',
            password: '',
            sdt: '',
            role: '',
            provider: '',
            providerId: ''
          }; // Reset form
        } else {
          console.error('Error adding account:', response.message);
        }
      },
      (error) => {
        console.error('Error occurred:', error);
      }
    );
  }

  // Edit Account
  editAccount(account: Account): void {
    this.selectedAccount = { ...account }; // Clone the account to make edits
  }

  updateAccount(): void {
    if (this.selectedAccount) {
      this.accountService.updateAccount(this.selectedAccount.maTK!, {
        password: this.selectedAccount.password,
        sdt: this.selectedAccount.sdt
      }).subscribe(
        (response) => {
          if (response.status === 200) {
            const index = this.accounts.findIndex(account => account.maTK === this.selectedAccount!.maTK);
            if (index !== -1) {
              this.accounts[index] = response.result; // Update the account in the list
            }
            this.selectedAccount = null;  // Clear the selected account
          } else {
            console.error('Error updating account:', response.message);
          }
        },
        (error) => {
          console.error('Error occurred:', error);
        }
      );
    }
  }

  // Delete Account
  deleteAccount(id: number): void {
    if (confirm('Are you sure you want to delete this account?')) {
      this.accountService.deleteAccount(id).subscribe(
        (response) => {
          if (response.status === 200) {
            this.accounts = this.accounts.filter(account => account.maTK !== id);  // Remove the deleted account from the list
          } else {
            console.error('Error deleting account:', response.message);
          }
        },
        (error) => {
          console.error('Error occurred:', error);
        }
      );
    }
  }
}
