// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Star,
  Tv,
  Film,
  TrendingUp,
  Menu,
  X,
  Settings,
  AlertCircle,
  Info,
  Search as SearchIcon,
} from "lucide-react";

/* ------------------ MOCK + CONFIG ------------------ */
const MOCK_DATA = {
  comedy_tv: [
    { id: 1, name: "Ted Lasso", poster_path: "/5kQA96w04Kq1tW2r2Tf5f3f.jpg", vote_average: 8.9, overview: "Ted Lasso...", first_air_date: "2020-08-14" },
    { id: 2, name: "The Office", poster_path: "/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg", vote_average: 8.6, overview: "A mockumentary...", first_air_date: "2005-03-24" },
    { id: 3, name: "Friends", poster_path: "/f496cm9enuEsZkSPzCwnTESEK5s.jpg", vote_average: 8.5, overview: "Friends...", first_air_date: "1994-09-22" },
  ],
  action_movies: [
    { id: 101, title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", vote_average: 8.5, overview: "Batman...", release_date: "2008-07-18" },
    { id: 102, title: "Inception", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", vote_average: 8.4, overview: "Inception...", release_date: "2010-07-16" },
    { id: 103, title: "Gladiator", poster_path: "/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg", vote_average: 8.2, overview: "Gladiator...", release_date: "2000-05-05" },
  ],
};

const GENRES = {
  movie: [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 35, name: "Comedy" },
    { id: 18, name: "Drama" },
    { id: 27, name: "Horror" },
    { id: 878, name: "Sci-Fi" },
    { id: 80, name: "Crime" },
  ],
  tv: [
    { id: 10759, name: "Action & Adventure" },
    { id: 35, name: "Comedy" },
    { id: 18, name: "Drama" },
    { id: 9648, name: "Mystery" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 80, name: "Crime" },
  ],
};

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";
const OMDB_BASE_URL = "https://www.omdbapi.com/";

/* ------------------ Helpers & Types ------------------ */
type AnyItem = Record<string, any>;
const safeYear = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  const m = dateStr.match(/(\d{4})/);
  return m ? m[1] : "N/A";
};

/* ------------------ UI Pieces ------------------ */

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title?: string; children?: React.ReactNode }> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div ref={modalRef} className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 relative shadow-2xl">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <h3 id="dialog-title" className="text-xl font-bold text-white mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
};

const RatingBadge: React.FC<{ rating?: number }> = ({ rating = 0 }) => {
  const r = Number(rating) || 0;
  const getColor = (v: number) => {
    if (v >= 8) return "text-green-400 border-green-500/50 bg-green-500/10";
    if (v >= 6) return "text-yellow-400 border-yellow-500/50 bg-yellow-500/10";
    return "text-red-400 border-red-500/50 bg-red-500/10";
  };
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${getColor(r)} text-xs font-bold`} aria-label={`Rating ${r.toFixed(1)}`}>
      <Star size={12} className="fill-current" />
      {r.toFixed(1)}
    </div>
  );
};

const ContentCard: React.FC<{ item: AnyItem; type: "movie" | "tv" }> = ({ item, type }) => {
  const title = item.title || item.name || item.Title || "Untitled";
  const date = item.release_date || item.first_air_date || item.Year || "";
  const year = safeYear(date as string);
  const imageSrc = item.poster_path
    ? (item.poster_path.startsWith("/") ? `${IMG_BASE_URL}${item.poster_path}` : item.poster_path)
    : item.Poster && item.Poster !== "N/A"
      ? item.Poster
      : "https://via.placeholder.com/300x450?text=No+Image";

  // rating: TMDB uses vote_average, OMDb uses imdbRating (string)
  const rating = item.vote_average ?? (item.imdbRating ? Number(item.imdbRating) : 0);

  return (
    <article className="group relative bg-slate-800/50 rounded-xl overflow-hidden hover:bg-slate-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-700/50 hover:border-slate-600" aria-labelledby={`title-${item.id || item.imdbID}`}>
      <div className="aspect-[2/3] overflow-hidden relative">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://via.placeholder.com/300x450?text=No+Poster"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" aria-hidden />
        <div className="absolute top-2 right-2">
          <RatingBadge rating={rating} />
        </div>
      </div>

      <div className="p-4">
        <h3 id={`title-${item.id || item.imdbID}`} className="text-white font-semibold truncate text-lg mb-1" title={title}>{title}</h3>
        <div className="flex justify-between items-center text-slate-400 text-sm mb-3">
          <span>{year}</span>
          <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] border border-slate-600 px-1 rounded">
            {type === "tv" ? "Series" : "Movie"}
          </span>
        </div>
        <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{item.overview || item.Plot || "No description available."}</p>
      </div>
    </article>
  );
};

/* ------------------ APP ------------------ */

export default function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<"tv" | "movie">("tv");
  const [selectedGenre, setSelectedGenre] = useState<number>(35);
  const [items, setItems] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tmdbApiKey, setTmdbApiKey] = useState<string>(() => localStorage.getItem("tmdb_api_key") || "");
  const [omdbApiKey, setOmdbApiKey] = useState<string>(() => localStorage.getItem("omdb_api_key") || "");
  const [apiProvider, setApiProvider] = useState<"tmdb" | "omdb">(() => (localStorage.getItem("api_provider") as "tmdb" | "omdb") || "tmdb");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(() => localStorage.getItem("ranked_live_mode") === "true");

  // Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchLimit, setSearchLimit] = useState<number>(10);
  const [lastNaturalSearch, setLastNaturalSearch] = useState<string | null>(null);

  // persist keys & provider
  useEffect(() => { localStorage.setItem("tmdb_api_key", tmdbApiKey || ""); }, [tmdbApiKey]);
  useEffect(() => { localStorage.setItem("omdb_api_key", omdbApiKey || ""); }, [omdbApiKey]);
  useEffect(() => { localStorage.setItem("api_provider", apiProvider); }, [apiProvider]);
  useEffect(() => { localStorage.setItem("ranked_live_mode", isLiveMode ? "true" : "false"); }, [isLiveMode]);

  useEffect(() => {
    setSelectedGenre(GENRES[activeTab][0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --- MOCK loader
  const loadMockData = (limit = 10) => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      let results: AnyItem[] = [];
      if (activeTab === "tv" && selectedGenre === 35) results = MOCK_DATA.comedy_tv.slice();
      else if (activeTab === "movie" && selectedGenre === 28) results = MOCK_DATA.action_movies.slice();
      else {
        const genreName = GENRES[activeTab].find((g) => g.id === selectedGenre)?.name || "Unknown";
        results = Array(12).fill(null).map((_, i) => ({
          id: i + 900,
          name: `Top Rated ${genreName} ${activeTab === "tv" ? "Show" : "Movie"} #${i + 1}`,
          title: `Top Rated ${genreName} ${activeTab === "tv" ? "Show" : "Movie"} #${i + 1}`,
          vote_average: 8.0 + Math.random() * 2,
          overview: `Demo: top rated ${genreName}.`,
          first_air_date: "2023-01-01",
          release_date: "2023-01-01",
          poster_path: null,
        }));
      }
      results.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      setItems(results.slice(0, limit));
      setLoading(false);
    }, 450);
  };

  // --- OMDb fetcher
  // Strategy:
  // 1) Use `s=` search with the parsed keyword (genre or query) and type=movie (tv optional)
  // 2) Get list of imdbIDs (Search result)
  // 3) Fetch details (i=) for each imdbID to obtain imdbRating and full info
  // 4) Sort by imdbRating numeric and return top N
  const fetchOmdbData = async (limit = 10, searchTerm: string | null = null) => {
    const key = omdbApiKey.trim();
    if (!key) {
      setError("Please enter an OMDb API key in Settings to use OMDb provider.");
      setIsLiveMode(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = (searchTerm && searchTerm.trim().length > 0) ? searchTerm.trim() : GENRES[activeTab].find(g => g.id === selectedGenre)?.name || "";
      // OMDb search (page 1) - this returns up to 10 results per page
      const typeParam = activeTab === "tv" ? "series" : "movie";
      const searchUrl = `${OMDB_BASE_URL}?apikey=${encodeURIComponent(key)}&s=${encodeURIComponent(q)}&type=${encodeURIComponent(typeParam)}&page=1`;
      const searchRes = await fetch(searchUrl);
      const searchJson = await searchRes.json();

      if (!searchJson || searchJson.Response === "False") {
        // fallback: try bare "movie" search term or return mock
        throw new Error(searchJson?.Error || "No results from OMDb");
      }

      const searchList = searchJson.Search || [];
      // limit how many details we fetch (avoid > 15 concurrent requests)
      const detailCap = Math.min(15, Math.max(limit, searchList.length));
      const ids = searchList.slice(0, detailCap).map((r: any) => r.imdbID);

      // fetch details in parallel
      const detailPromises = ids.map((id: string) =>
        fetch(`${OMDB_BASE_URL}?apikey=${encodeURIComponent(key)}&i=${encodeURIComponent(id)}&plot=short&r=json`).then(r => r.json())
      );
      const details = await Promise.all(detailPromises);

      // filter valid items and parse rating
      const parsed: AnyItem[] = details
        .filter((d: any) => d && d.Response !== "False")
        .map((d: any) => ({ ...d, imdbRating: d.imdbRating === "N/A" ? null : Number(d.imdbRating) }));

      parsed.sort((a: any, b: any) => (b.imdbRating || 0) - (a.imdbRating || 0));
      setItems(parsed.slice(0, limit));
    } catch (err: any) {
      console.error("OMDb fetch failed:", err);
      setError("OMDb fetch failed or returned no results. Falling back to demo data.");
      setIsLiveMode(false);
      loadMockData(limit);
    } finally {
      setLoading(false);
    }
  };

  // --- TMDB fetcher (same as before) ---
  const fetchTmdbData = async (limit = 10, signal?: AbortSignal) => {
    if (!tmdbApiKey) {
      setError("Please enter a TMDB API Key in settings to use TMDB.");
      setIsLiveMode(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        api_key: tmdbApiKey,
        with_genres: String(selectedGenre),
        sort_by: "vote_average.desc",
        "vote_count.gte": "100",
        language: "en-US",
        page: "1",
      });

      const endpoint = `${TMDB_BASE_URL}/discover/${activeTab}?${params.toString()}`;
      const res = await fetch(endpoint, { signal });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();
      if (data.success === false) throw new Error(data.status_message || "API Error");
      const results: AnyItem[] = (data.results || []).sort((a: AnyItem, b: AnyItem) => (b.vote_average || 0) - (a.vote_average || 0));
      setItems(results.slice(0, limit));
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error(err);
      setError("Failed to fetch TMDB. Falling back to demo data.");
      setIsLiveMode(false);
      loadMockData(limit);
    } finally {
      setLoading(false);
    }
  };

  // decide which provider to call
  const fetchLiveData = async (limit = 10, searchTerm: string | null = null, signal?: AbortSignal) => {
    if (apiProvider === "omdb") {
      await fetchOmdbData(limit, searchTerm);
    } else {
      await fetchTmdbData(limit, signal);
    }
  };

  // trigger loads
  useEffect(() => {
    const controller = new AbortController();
    if (isLiveMode) fetchLiveData(searchLimit, null, controller.signal);
    else loadMockData(searchLimit);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedGenre, isLiveMode, tmdbApiKey, omdbApiKey, apiProvider, searchLimit]);

  /* ------------------ Natural language parser (unchanged, slightly extended) ------------------ */
  const findGenreByName = (name: string, type: "movie" | "tv"): { id: number; name: string } | null => {
    const q = name.toLowerCase().trim();
    const candidates = GENRES[type] ?? [];
    let found = candidates.find((g) => g.name.toLowerCase() === q);
    if (found) return found as any;
    found = candidates.find((g) => g.name.toLowerCase().includes(q) || q.includes(g.name.toLowerCase()));
    if (found) return found as any;
    for (const t of ["movie", "tv"] as const) {
      const candidates2 = GENRES[t];
      const f2 = candidates2.find((g) => g.name.toLowerCase().includes(q) || q.includes(g.name.toLowerCase()));
      if (f2) return f2 as any;
    }
    return null;
  };

  const performNaturalSearch = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    let limit = 10;
    let type: "movie" | "tv" | null = null;
    let genreWord: string | null = null;

    const mCount = q.match(/top\s+(\d{1,2})/i);
    if (mCount) limit = Math.max(1, Math.min(50, Number(mCount[1])));

    if (q.includes("movie") || q.includes("movies") || q.includes("film") || q.includes("films")) type = "movie";
    if (q.includes("tv") || q.includes("series") || q.includes("show") || q.includes("shows")) type = "tv";
    if (!type) type = activeTab;

    let mGenre = q.match(/rated\s+([a-z &]+?)\s+(movies|movie|series|shows|show)?$/i);
    if (!mGenre) mGenre = q.match(/top(?:\s+\d+)?\s+([a-z &]+?)\s+(movies|movie|series|shows|show)?$/i);
    if (mGenre && mGenre[1]) genreWord = mGenre[1].trim();

    if (!genreWord) {
      const tokens = q.split(/\s+/).filter(Boolean);
      const last = tokens[tokens.length - 1];
      if (last && !["movies", "movie", "series", "show", "shows", "rated", "top"].includes(last)) genreWord = last;
    }

    let mappedGenreId = selectedGenre;
    if (genreWord) {
      const candidate = findGenreByName(genreWord, type || activeTab);
      if (candidate) mappedGenreId = candidate.id;
      else {
        const candMovie = findGenreByName(genreWord, "movie");
        if (candMovie) mappedGenreId = candMovie.id;
      }
    }

    setSearchLimit(limit);
    if (type) setActiveTab(type);
    setSelectedGenre(mappedGenreId);
    setLastNaturalSearch(query);
    setSearchQuery(query);

    // If OMDb provider, we want to pass the parsed keyword to OMDb search
    if (apiProvider === "omdb") {
      const searchTerm = genreWord || query;
      // trigger OMDb fetch with searchTerm
      fetchOmdbData(limit, searchTerm);
    } else {
      // TMDB flow will be handled by useEffect which observes searchLimit/selectedGenre/isLiveMode
    }
  };

  // UI handlers
  const handleTabChange = (tab: "tv" | "movie") => { setActiveTab(tab); setSelectedGenre(GENRES[tab][0].id); setIsSidebarOpen(false); };
  const handleGenreChange = (id: number) => { setSelectedGenre(id); setIsSidebarOpen(false); };

  const titleText = useMemo(() => {
    const g = GENRES[activeTab].find((g) => g.id === selectedGenre)?.name || "";
    return `Top Rated ${g} ${activeTab === "tv" ? "Series" : "Movies"}`;
  }, [activeTab, selectedGenre]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") performNaturalSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-slate-800 rounded-lg" aria-label="Open menu"><Menu size={20} /></button>
            <div className="flex items-center gap-2 text-purple-400"><TrendingUp size={24} className="fill-current" /><h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">Ranked<span className="text-purple-400">Stream</span></h1></div>
          </div>

          {/* SEARCH */}
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder='Try: "top 10 rated crime movies"'
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Search top rated"
              />
              <button onClick={() => performNaturalSearch(searchQuery)} className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-900" aria-label="Search" title="Search">
                <SearchIcon size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Natural queries: <em>top 10 rated crime movies</em>, <em>top 5 comedy series</em></p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button onClick={() => { setIsLiveMode(false); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!isLiveMode ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>Demo Data</button>
              <button onClick={() => { if (apiProvider === "tmdb" && !tmdbApiKey) setIsSettingsOpen(true); else if (apiProvider === "omdb" && !omdbApiKey) setIsSettingsOpen(true); else setIsLiveMode(true); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${isLiveMode ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}>Live API</button>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Settings" aria-label="Open settings"><Settings size={20} /></button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto pt-20 pb-12 flex">
        {/* SIDEBAR */}
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-5rem)] lg:bg-transparent lg:border-r-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="h-full overflow-y-auto p-4 lg:pt-0">
            <div className="flex justify-between items-center lg:hidden mb-6"><span className="font-bold text-white">Menu</span><button onClick={() => setIsSidebarOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Media Type</h3>
                <div className="space-y-1">
                  <button onClick={() => handleTabChange("tv")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "tv" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`} aria-pressed={activeTab === "tv"}><Tv size={18} />Series & Shows</button>
                  <button onClick={() => handleTabChange("movie")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "movie" ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`} aria-pressed={activeTab === "movie"}><Film size={18} />Movies</button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Top Rated By Genre</h3>
                <div className="space-y-1">
                  {GENRES[activeTab].map((genre) => (
                    <button key={genre.id} onClick={() => handleGenreChange(genre.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedGenre === genre.id ? "bg-slate-800 text-white border-l-2 border-purple-500" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`} aria-pressed={selectedGenre === genre.id}>
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-purple-400 mt-1 shrink-0" />
                  <p className="text-xs text-slate-400 leading-relaxed">This app can use <strong>TMDB</strong> (full genre discovery) or <strong>OMDb</strong> (IMDB ratings via OMDb API). OMDb searches by keyword and may make multiple requests.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

        {/* CONTENT */}
        <main className="flex-1 px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{lastNaturalSearch ? `Results for “${lastNaturalSearch}”` : titleText}</h2>
              <p className="text-slate-400 text-sm">Sorted by highest user rating • {items.length} results</p>
            </div>
          </div>

          {error && <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-lg flex items-center gap-3 mb-8"><AlertCircle size={20} />{error}</div>}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
              {[...Array(8)].map((_, i) => <div key={i} className="aspect-[2/3] bg-slate-800 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {items.map((item) => <ContentCard key={item.id || item.imdbID} item={item} type={activeTab} />)}
            </div>
          )}

          {!loading && items.length === 0 && !error && <div className="text-center py-20"><p className="text-slate-500 text-lg">No results found.</p></div>}
        </main>
      </div>

      {/* SETTINGS */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Data Source Settings">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">Choose your live data provider and enter its API key. TMDB supports genre discovery. OMDb uses IMDB data but searches by keyword and requires per-item detail requests to get ratings.</p>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-xs font-semibold text-slate-500 uppercase">API Provider</label>
            <div className="flex gap-2 items-center">
              <label className={`px-3 py-2 rounded-lg border ${apiProvider === "tmdb" ? "bg-purple-600 text-white" : "text-slate-300 bg-slate-800"}`}>
                <input type="radio" name="provider" checked={apiProvider === "tmdb"} onChange={() => setApiProvider("tmdb")} /> TMDB
              </label>
              <label className={`px-3 py-2 rounded-lg border ${apiProvider === "omdb" ? "bg-purple-600 text-white" : "text-slate-300 bg-slate-800"}`}>
                <input type="radio" name="provider" checked={apiProvider === "omdb"} onChange={() => setApiProvider("omdb")} /> OMDb (IMDB)
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">TMDB API Key (v3)</label>
              <input type="text" value={tmdbApiKey} onChange={(e) => setTmdbApiKey(e.target.value)} placeholder="TMDB API Key" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">OMDb API Key</label>
              <input type="text" value={omdbApiKey} onChange={(e) => setOmdbApiKey(e.target.value)} placeholder="OMDb API Key (get from http://www.omdbapi.com/apikey.aspx)" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button onClick={() => { setIsSettingsOpen(false); if (apiProvider === "omdb" && !omdbApiKey) setError("Please add OMDb API key to enable OMDb"); if (apiProvider === "tmdb" && !tmdbApiKey) setError("Please add TMDB API key to enable TMDB"); }} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-900/20">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}