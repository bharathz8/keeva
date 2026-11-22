"use client";

import React, { useEffect, useState } from "react";
import { getPeople } from "@/lib/api";
import { Person } from "@/types";
import { RelationshipCard } from "@/components/RelationshipCard";
import { AddPersonModal } from "@/components/AddPersonModal";
import { SeedDemoButton } from "@/components/SeedDemoButton";
import { usePrivacy } from "@/context/PrivacyContext";
import { 
  UserPlus, 
  Users, 
  Loader2, 
  Search, 
  Filter, 
  ShieldCheck, 
  Lock, 
  Unlock,
  Sparkles,
  X
} from "lucide-react";

export default function PeoplePage() {
  const { isLocked, openModal } = usePrivacy();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const data = await getPeople();
      setPeople(data);
    } catch (err) {
      console.error("Error fetching people:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const relationshipTypes = ["All", "Friend", "Coworker", "Partner", "Family", "Other"];

  const filteredPeople = people.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.alias && p.alias.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.relationshipType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType =
      selectedFilter === "All" ||
      p.relationshipType.toLowerCase() === selectedFilter.toLowerCase() ||
      (selectedFilter === "Family" && ["Parent", "Sibling", "Family"].includes(p.relationshipType));

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950">
              People & Relationships
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {people.length} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Maintain external longitudinal memory profiles, context patterns, and interaction histories.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SeedDemoButton onSuccess={fetchPeople} />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold hover:bg-stone-800 shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>Add Person</span>
          </button>
        </div>
      </div>

      {/* Privacy Cloak Reminder Banner */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isLocked 
          ? "bg-amber-50/70 border-amber-200/90 text-amber-950" 
          : "bg-emerald-50/70 border-emerald-200/90 text-emerald-950"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${isLocked ? "bg-amber-200 text-amber-900" : "bg-emerald-200 text-emerald-900"}`}>
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </div>
          <div>
            <span className="font-bold">
              {isLocked 
                ? "Privacy Shield is Active: Names are cloaked behind proxy codenames." 
                : "Privacy Shield is Unlocked: Real names are currently revealed."}
            </span>
            <span className="text-stone-500 block text-[11px]">
              {isLocked 
                ? "Click 'Unlock' to enter your Master PIN or security answer to reveal original identities."
                : "Click 'Manage' to re-cloak the vault before sharing your screen."}
            </span>
          </div>
        </div>

        <button
          onClick={openModal}
          className="px-3 py-1.5 bg-white border border-stone-200 text-stone-900 rounded-xl text-xs font-bold hover:bg-stone-50 shadow-2xs transition-colors shrink-0"
        >
          {isLocked ? "Unlock Real Names" : "Manage / Cloak"}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by real name, proxy codename, or note..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/60 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 mr-1 hidden sm:block shrink-0" />
          {relationshipTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedFilter === type
                  ? "bg-stone-900 text-stone-50 shadow-xs"
                  : "bg-stone-100/80 text-stone-600 hover:bg-stone-200/70 hover:text-stone-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-24 flex justify-center text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="bg-white border-2 border-stone-200 border-dashed rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-900 text-base">
            {searchQuery ? "No matching relationships found" : "No relationships tracked yet"}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? `No people matched "${searchQuery}". Try clearing your search query or switching filters.`
              : "Add someone to begin tracking longitudinal notes, or load the demo seed data to explore Rahul's profile."}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <SeedDemoButton onSuccess={fetchPeople} />
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-stone-900 text-stone-50 text-xs font-bold rounded-xl hover:bg-stone-800 shadow-xs"
            >
              + Add Person
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPeople.map((person) => (
            <RelationshipCard key={person.id} person={person} />
          ))}
        </div>
      )}

      <AddPersonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPersonCreated={(p) => setPeople([p, ...people])}
      />
    </div>
  );
}
