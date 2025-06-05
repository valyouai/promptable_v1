"use client";
"use client";
import React from 'react';
import Link from 'next/link';
const personaCards = [
    {
        title: "Creator",
        description: "For creative professionals and content creators",
        icon: "✍️",
        route: "/creator"
    },
    {
        title: "Educator",
        description: "For teachers and instructional designers",
        icon: "📚",
        route: "/educator"
    },
    {
        title: "Researcher",
        description: "For academics and analytical professionals",
        icon: "📊",
        route: "/researcher"
    },
];
export default function Dashboard() {
    return (<div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">Who are you?</h1>

      <section className="mb-16 w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto">
          {personaCards.map((card, index) => (<Link href={card.route} key={index}>
              <div className="bg-white rounded-lg shadow-lg p-6 text-center cursor-pointer hover:shadow-xl transition-shadow duration-300">
                <div className="text-5xl mb-4">{card.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-600">{card.description}</p>
              </div>
            </Link>))}
        </div>
      </section>
    </div>);
}
