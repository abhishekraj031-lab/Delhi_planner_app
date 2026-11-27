export type Category =
  | 'Monuments' | 'Modern Landmarks' | 'Museums' | 'Religious & spiritual'
  | 'Gardens & Parks' | 'Markets & Food' | 'Entertainment';

/** Adult ticket price in rupees: Indian (i) and foreign (f). null = not available. */
export type Price = { i: number | null; f: number | null };
export type Ticket = { label: string; value: string; unverified: boolean };
export type Rule = { label: string; value: string };

export type Place = {
  id: string; name: string; area: string;
  /** English name and area, kept when the place is shown in another language so search and labels still work. */
  nameEn?: string; areaEn?: string; category: Category; emoji: string; color: string;
  /** Weekly closed days (0 = Sunday). null means opening days are not known. */
  closedDays: number[] | null;
  /** [open, close] in minutes after midnight. null = not known. */
  hours: [number, number] | null;
  hoursText: string | null; hoursUnverified: boolean;
  price: { weekday: Price; weekend: Price; unverified: boolean };
  tickets: Ticket[]; rules: Rule[];
  partialNote: string | null; partialNoteByDay: Record<string, string>;
  metro: string | null; metroUnverified?: boolean; duration: string | null; description: string | null;
  /** Short tips shown in the Things to know card. The card stays hidden while this is empty. */
  thingsToKnow?: string[];
  /** Official booking page. The Book tickets button stays hidden while this is null. */
  bookUrl: string | null; bookable: boolean;
  source: string; verifiedNote: string; photoCredit: string | null;
  /** Saved snapshot of the Google rating. The rating stays hidden while this is missing. */
  rating?: { score: number; count: number; source: string; checked: string };
  lat: number; lng: number;
};
export type Coords = { lat: number; lng: number };
export type UserLocation = Coords & { label: string; kind: 'gps' | 'area' };
