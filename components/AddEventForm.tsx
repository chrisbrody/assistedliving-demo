"use client";

import { useState } from "react";
import type { Resident, EventType } from "@/lib/types";

interface AddEventFormProps {
  residents: Resident[];
  onSubmit: (data: {
    resident_id: string;
    pickup_time: string;
    event_type: EventType;
    purpose: string;
    notes: string;
  }) => void;
  isSubmitting?: boolean;
}

export function AddEventForm({ residents, onSubmit, isSubmitting = false }: AddEventFormProps) {
  const [residentId, setResidentId] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [eventType, setEventType] = useState<EventType>("family_pickup");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  // Set default time to next hour
  useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    const timeStr = now.toTimeString().slice(0, 5);
    setPickupTime(timeStr);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!residentId || !pickupTime) {
      alert("Please select a resident and pickup time");
      return;
    }

    // Convert time to full ISO timestamp (today's date)
    const today = new Date();
    const [hours, minutes] = pickupTime.split(":").map(Number);
    today.setHours(hours, minutes, 0, 0);

    onSubmit({
      resident_id: residentId,
      pickup_time: today.toISOString(),
      event_type: eventType,
      purpose,
      notes,
    });

    // Reset form
    setResidentId("");
    setPurpose("");
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Add New Pickup</h2>

      {/* Resident Select */}
      <div>
        <label htmlFor="resident" className="block text-sm font-medium text-gray-700 mb-1">
          Resident
        </label>
        <select
          id="resident"
          value={residentId}
          onChange={(e) => setResidentId(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select a resident...</option>
          {residents.map((r) => (
            <option key={r.id} value={r.id}>
              {r.full_name} (Room {r.room_number})
            </option>
          ))}
        </select>
      </div>

      {/* Time & Type Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
            Pickup Time
          </label>
          <input
            type="time"
            id="time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            id="type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="family_pickup">Family Pickup</option>
            <option value="doctor_appointment">Doctor Appt</option>
            <option value="facility_van">Facility Van</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
          Purpose (optional)
        </label>
        <input
          type="text"
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="e.g., Family dinner, Physical therapy"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <input
          type="text"
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Needs walker and blue folder"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                 text-white text-lg font-semibold rounded-xl transition-colors"
      >
        {isSubmitting ? "Adding..." : "Add Pickup"}
      </button>
    </form>
  );
}
