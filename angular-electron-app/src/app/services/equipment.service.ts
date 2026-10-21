import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Equipment } from '../models/equipment.model';
import { INITIAL_EQUIPMENT_DATA } from '../data/mock-equipment.data';

export interface EquipmentSummary {
  total: number;
  operational: number;
  maintenanceDue: number;
  offline: number;
  standby: number;
  avgTemperature: number;
}

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private readonly _items$ = new BehaviorSubject<Equipment[]>(INITIAL_EQUIPMENT_DATA);

  // Observable stream of items
  public readonly items$: Observable<Equipment[]> = this._items$.asObservable();

  // Observable metrics computed reactively
  public readonly summary$: Observable<EquipmentSummary> = this.items$.pipe(
    map((list) => {
      const total = list.length;
      const operational = list.filter(i => i.status === 'Operational').length;
      const maintenanceDue = list.filter(i => i.status === 'Maintenance Due').length;
      const offline = list.filter(i => i.status === 'Offline').length;
      const standby = list.filter(i => i.status === 'Standby').length;
      const avgTemperature = total > 0
        ? Number((list.reduce((acc, curr) => acc + curr.temperatureCelsius, 0) / total).toFixed(1))
        : 0;

      return { total, operational, maintenanceDue, offline, standby, avgTemperature };
    })
  );

  // Create
  public addEquipment(equipment: Omit<Equipment, 'id'>): void {
    const current = this._items$.getValue();
    const newId = `EQ-${1000 + current.length + 1}`;
    const newItem: Equipment = {
      ...equipment,
      id: newId
    };
    this._items$.next([newItem, ...current]);
  }

  // Update
  public updateEquipment(updated: Equipment): void {
    const current = this._items$.getValue();
    const index = current.findIndex(i => i.id === updated.id);
    if (index !== -1) {
      const updatedList = [...current];
      updatedList[index] = { ...updated };
      this._items$.next(updatedList);
    }
  }

  // Delete
  public deleteEquipment(id: string): void {
    const current = this._items$.getValue();
    this._items$.next(current.filter(i => i.id !== id));
  }

  // Reset to default mock data
  public resetToDefault(): void {
    this._items$.next([...INITIAL_EQUIPMENT_DATA]);
  }
}
