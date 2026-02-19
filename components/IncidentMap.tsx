"use client";

import { useEffect, useRef } from "react";

interface IncidentMapProps {
    /** Incident coords — defaults to a central Delhi location */
    incidentLat?: number;
    incidentLng?: number;
    /** Base/origin coords — defaults to a nearby hospital */
    originLat?: number;
    originLng?: number;
    className?: string;
}

export default function IncidentMap({
    incidentLat = 28.6139,
    incidentLng = 77.209,
    originLat = 28.6200,
    originLng = 77.2000,
    className = "",
}: IncidentMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    // Keep track of the leaflet map instance so we don't re-init
    const mapInstanceRef = useRef<unknown>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Dynamically import Leaflet (browser-only)
        import("leaflet").then((L) => {
            // Fix default icon paths broken by webpack
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current!, {
                zoomControl: true,
                scrollWheelZoom: false,
                attributionControl: false,
            }).setView([incidentLat, incidentLng], 14);

            mapInstanceRef.current = map;

            // OpenStreetMap tiles (free, no API key)
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(map);

            // ── Incident marker (red pulsing) ──────────────────────────────
            const incidentIcon = L.divIcon({
                className: "",
                html: `
                    <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
                        <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(239,68,68,0.25);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
                        <div style="width:18px;height:18px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);z-index:1;"></div>
                    </div>
                    <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });

            L.marker([incidentLat, incidentLng], { icon: incidentIcon })
                .addTo(map)
                .bindPopup("<b>🚨 Incident Site</b><br>Emergency in progress")
                .openPopup();

            // ── Origin marker (ambulance base) ─────────────────────────────
            const originIcon = L.divIcon({
                className: "",
                html: `
                    <div style="width:32px;height:32px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
                        <span style="font-size:14px;">🚑</span>
                    </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            L.marker([originLat, originLng], { icon: originIcon })
                .addTo(map)
                .bindPopup("<b>🚑 AMB-042</b><br>Base Station · En Route");

            // ── Fetch real route from OSRM (free, no key) ─────────────────
            const osrmUrl =
                `https://router.project-osrm.org/route/v1/driving/` +
                `${originLng},${originLat};${incidentLng},${incidentLat}` +
                `?overview=full&geometries=geojson`;

            fetch(osrmUrl)
                .then((r) => r.json())
                .then((data) => {
                    if (data.routes && data.routes[0]) {
                        const routeGeoJson = data.routes[0].geometry;
                        const routeLayer = L.geoJSON(routeGeoJson, {
                            style: {
                                color: "#f97316",
                                weight: 5,
                                opacity: 0.85,
                                dashArray: "10 6",
                                lineCap: "round",
                                lineJoin: "round",
                            },
                        }).addTo(map);

                        // Fit map to show full route
                        map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
                    }
                })
                .catch(() => {
                    // Fallback: draw a straight dashed line if OSRM fails
                    L.polyline(
                        [[originLat, originLng], [incidentLat, incidentLng]],
                        { color: "#f97316", weight: 4, dashArray: "10 6" }
                    ).addTo(map);
                    map.fitBounds([[originLat, originLng], [incidentLat, incidentLng]], { padding: [40, 40] });
                });
        });

        return () => {
            if (mapInstanceRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (mapInstanceRef.current as any).remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {/* Leaflet CSS */}
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            />
            <div
                ref={mapRef}
                className={`w-full ${className}`}
                style={{ minHeight: 280, height: "100%" }}
            />
        </>
    );
}
