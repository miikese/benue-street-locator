"use client";
import { useState } from "react";
import {
  MapPin,
  Route,
  CheckCircle2,
  Download,
  ArrowRight,
} from "lucide-react";
import { distance } from "../lib/domain";
import type { JourneyPlace } from "../lib/journeys";
import type { RecordItem } from "../lib/client";
import { PlaceMap } from "./map";
export function journeyRecord(p: JourneyPlace): RecordItem {
  return {
    id: p.id,
    kind: "journey",
    status: p.status,
    created: p.created,
    updated: p.updated,
    data: {
      ...p,
      category: p.status === "planned" ? "Planned stop" : "Visited place",
      lga: "Benue",
      description:
        p.note || "Saved privately in your journey journal on this device.",
    },
  };
}
export function JourneyJournal({
  places,
  onChange,
  onSelect,
}: {
  places: JourneyPlace[];
  onChange: (p: JourneyPlace[]) => void;
  onSelect: (p: RecordItem) => void;
}) {
  const [tab, setTab] = useState<"planned" | "visited">("planned"),
    [q, setQ] = useState("");
  const shown = places.filter(
    (p) =>
      p.status === tab &&
      [p.name, p.address, p.note]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  const km = shown.reduce(
    (n, p, i) => (i ? n + distance(shown[i - 1], p) : n),
    0,
  );
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { version: 1, exported: new Date().toISOString(), places },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "benue-private-journeys.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const move = (id: string, offset: number) => {
    const list = [...places],
      i = list.findIndex((p) => p.id === id),
      target = shown[shown.findIndex((p) => p.id === id) + offset];
    if (!target) return;
    const j = list.findIndex((p) => p.id === target.id);
    [list[i], list[j]] = [list[j], list[i]];
    onChange(list);
  };
  return (
    <section className="section journey-page">
      <p className="eyebrow">A place for every next step</p>
      <div className="heading-row">
        <div>
          <h1>
            Where you’ve been.
            <br />
            <em>Where you’re going.</em>
          </h1>
          <p className="muted">
            Plan your stops, add a note, and keep a private journal of Benue.
          </p>
        </div>
        <button
          className="button secondary"
          disabled={!places.length}
          onClick={exportData}
        >
          <Download size={16} />
          Export journal
        </button>
      </div>
      <div className="journey-summary">
        <article>
          <Route size={20} />
          <strong>{places.filter((p) => p.status === "planned").length}</strong>
          <span>Places to go</span>
        </article>
        <article>
          <CheckCircle2 size={20} />
          <strong>{places.filter((p) => p.status === "visited").length}</strong>
          <span>Places visited</span>
        </article>
        <article>
          <MapPin size={20} />
          <strong>Just yours</strong>
          <span>Stored on this device</span>
        </article>
      </div>
      <div className="journey-tabs">
        <button
          className={tab === "planned" ? "active" : ""}
          aria-pressed={tab === "planned"}
          onClick={() => setTab("planned")}
        >
          Going next
        </button>
        <button
          className={tab === "visited" ? "active" : ""}
          aria-pressed={tab === "visited"}
          onClick={() => setTab("visited")}
        >
          Been here
        </button>
        <input
          aria-label="Search journey journal"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find a saved stop…"
        />
      </div>
      <div className="journey-layout">
        <div>
          {shown.length ? (
            shown.map((p, i) => (
              <article className="journey-stop" key={p.id}>
                <span className="stop-number">{i + 1}</span>
                <div>
                  <small>
                    {p.date
                      ? new Date(p.date + "T12:00:00").toLocaleDateString()
                      : "No date set"}
                  </small>
                  <h3>{p.name}</h3>
                  <p>
                    {p.address || p.lat.toFixed(5) + ", " + p.lng.toFixed(5)}
                  </p>
                  {p.note && <p className="journey-note">{p.note}</p>}
                  <div className="button-row">
                    <button
                      className="text-button"
                      onClick={() => onSelect(journeyRecord(p))}
                    >
                      Details & directions <ArrowRight size={14} />
                    </button>
                    {tab === "planned" && (
                      <button
                        className="button small secondary"
                        onClick={() =>
                          onChange(
                            places.map((r) =>
                              r.id === p.id
                                ? {
                                    ...r,
                                    status: "visited",
                                    date: new Intl.DateTimeFormat(
                                      "en-CA",
                                    ).format(new Date()),
                                    updated: new Date().toISOString(),
                                  }
                                : r,
                            ),
                          )
                        }
                      >
                        Mark visited
                      </button>
                    )}
                    <button
                      className="text-button"
                      aria-label={"Remove " + p.name}
                      onClick={() =>
                        onChange(places.filter((r) => r.id !== p.id))
                      }
                    >
                      Remove
                    </button>
                    {tab === "planned" && (
                      <>
                        <button
                          className="text-button"
                          aria-label={"Move " + p.name + " up"}
                          disabled={i === 0}
                          onClick={() => move(p.id, -1)}
                        >
                          ↑
                        </button>
                        <button
                          className="text-button"
                          aria-label={"Move " + p.name + " down"}
                          disabled={i === shown.length - 1}
                          onClick={() => move(p.id, 1)}
                        >
                          ↓
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="launch-empty">
              <h3>
                {q
                  ? "No matching stops"
                  : "Your next chapter starts on the map."}
              </h3>
              <p>
                Search for a place or choose a map pin, then select “Plan to go”
                or “I’ve been here”.
              </p>
            </div>
          )}
          {tab === "planned" && shown.length > 1 && (
            <p className="muted">
              {km.toFixed(1)} km between these stops in list order, measured in
              straight lines. Use driving directions for actual roads.
            </p>
          )}
        </div>
        <PlaceMap rows={shown.map(journeyRecord)} onSelect={onSelect} />
      </div>
      <div className="journey-privacy">
        <p>
          No background tracking. Places are added only when you choose. Your
          journal is shared by people using this browser and is lost if browser
          storage is cleared.
        </p>
        <button
          className="text-button"
          disabled={!places.length}
          onClick={() => {
            if (
              confirm(
                "Clear all planned and visited places from this device? Export first if you want a copy.",
              )
            )
              onChange([]);
          }}
        >
          Clear journal from this device
        </button>
      </div>
    </section>
  );
}
