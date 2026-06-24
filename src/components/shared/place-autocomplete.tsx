"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  provider?: "kakao" | "google";
  lat?: number;
  lng?: number;
  phone?: string;
  category?: string;
  map_url?: string;
  route_url?: string;
}

export interface PlaceSelection {
  name: string;
  address: string;
  provider?: "kakao" | "google";
  placeId?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  category?: string;
  mapUrl?: string;
  routeUrl?: string;
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSelection) => void;
  placeholder?: string;
  className?: string;
}

export function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "장소 검색",
  className = "",
}: PlaceAutocompleteProps) {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const justSelected = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/web/place-search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      const items = (data.results ?? []) as PlaceResult[];
      setResults(items);
      setIsOpen(items.length > 0);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchPlaces(value.trim()), 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [value, searchPlaces]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(place: PlaceResult) {
    justSelected.current = true;
    onSelect({
      name: place.name,
      address: place.address,
      provider: place.provider,
      placeId: place.place_id,
      lat: place.lat,
      lng: place.lng,
      phone: place.phone,
      category: place.category,
      mapUrl: place.map_url,
      routeUrl: place.route_url,
    });
    onChange(place.name);
    setIsOpen(false);
    setResults([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              style={{ color: "var(--color-text-muted)" }}
            />
          ) : (
            <span
              className="material-symbols-outlined text-base"
              style={{ color: "var(--color-text-muted)" }}
            >
              search
            </span>
          )}
        </span>
      </div>

      {isOpen && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border shadow-lg"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          {results.map((place) => (
            <li key={place.place_id}>
              <button
                type="button"
                onClick={() => handleSelect(place)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface)]"
              >
                <span
                  className="material-symbols-outlined mt-0.5 shrink-0 text-lg"
                  style={{ color: "var(--color-primary)" }}
                >
                  location_on
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {place.name}
                  </p>
                  {place.address && (
                    <p
                      className="mt-0.5 truncate text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {place.address}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
