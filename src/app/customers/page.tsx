'use client';

import React, { useState } from 'react';
import {
  Users,
  Phone,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';

export default function CustomersPage() {
  const [customers] = useState([
    {
      id: 'c1',
      name: 'Shivam Sharma',
      phone: '+91 98765 43210',
      address: 'Flat 402, Green Valley Apts, Sector 62',
      language: 'Hinglish',
      ordersCount: 8,
      substitution_preference: 'Ask Customer',
      usualBasket: [
        '2 × Amul Taaza Toned Milk 500ml',
        '1 × Harvest Gold White Bread 400g',
        '1 × Fresh Farm White Eggs 12 Pack'
      ],
      lastOrder: '2 days ago'
    },
    {
      id: 'c2',
      name: 'Pooja Verma',
      phone: '+91 91234 56789',
      address: 'House 12, Gali 4, Shanti Nagar',
      language: 'Hinglish',
      ordersCount: 4,
      substitution_preference: 'Ask Customer',
      usualBasket: [
        '1 × Aashirvaad Atta 5kg',
        '1 × Tata Salt 1kg',
        '1 × Fortune Oil 1L'
      ],
      lastOrder: '4 days ago'
    },
    {
      id: 'c3',
      name: 'Rohan Mehta',
      phone: '+91 99887 76655',
      address: 'B-104, Sunrise Residency',
      language: 'Hinglish',
      ordersCount: 12,
      substitution_preference: 'Auto-Accept Closest Alternative',
      usualBasket: [
        '4 × Maggi 2-Minute Noodles',
        '2 × Amul Butter 100g'
      ],
      lastOrder: 'Yesterday'
    }
  ]);

  return (
    <main className="min-h-screen bg-stone-50 pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Customer Memory &amp; Profiles
              </h1>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Persistent customer history powers KiranaPilot&apos;s &quot;Mera usual wala bhej do&quot; autonomous re-ordering.
            </p>
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {customers.map(cust => (
            <div
              key={cust.id}
              className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs transition-colors hover:border-stone-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 font-bold text-xs text-stone-700">
                      {cust.name[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">{cust.name}</h3>
                      <p className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {cust.phone}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    {cust.ordersCount} orders
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400 mt-0.5" />
                    <span>{cust.address}</span>
                  </p>
                  <p className="text-[11px] text-stone-500">
                    <strong>Substitution Mode:</strong> {cust.substitution_preference}
                  </p>
                </div>

                {/* Usual Basket */}
                <div className="mt-4 rounded-lg bg-stone-50 p-3 border border-stone-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Usual Frequent Basket (&quot;Usual Wala&quot;)</span>
                  </div>
                  <ul className="space-y-1 text-xs text-stone-700">
                    {cust.usualBasket.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last order: {cust.lastOrder}
                </span>
                <span className="font-medium text-emerald-700">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
