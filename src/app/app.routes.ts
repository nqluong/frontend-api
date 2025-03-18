import { Routes } from '@angular/router';
import { HomeCustomerComponent } from './components/home-customer/home-customer.component';
import { RoomsComponent } from './components/rooms/rooms.component';
import { RoomsSuitsComponent } from './components/rooms-suits/rooms-suits.component';
import { RoomDetailsComponent } from './components/room-details/room-details.component';

export const routes: Routes = [
    {path: '', component: HomeCustomerComponent},
    {path: 'rooms', component: RoomsComponent},
    {path: 'rooms-suits', component: RoomsSuitsComponent},
    {path: 'room-details', component: RoomDetailsComponent}
];
