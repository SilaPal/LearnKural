'use client';

import React, { memo, useCallback, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import confetti from 'canvas-confetti';
import { COUNTRY_CENTERS } from '@/lib/country-centers';

// Features 110m map for better performance
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Darker, rich colors for the map regions to contrast against the bright ocean
const REGION_COLORS: string[] = [
    '#1d4ed8', // blue-700
    '#047857', // emerald-700
    '#b45309', // amber-700
    '#be185d', // pink-700
    '#6d28d9', // violet-700
    '#0369a1', // sky-700
    '#be123c', // rose-700
    '#4d7c0f', // lime-700
];

interface WorldMapProps {
    activeRegion: string;
    onSelectRegion: (region: string) => void;
    regionalLeaders: Record<string, {
        name: string;
        picture: string | null;
        streak: number;
        coins: number;
        weeklyXP: number;
    }>;
}

const WorldMap = ({ activeRegion, onSelectRegion, regionalLeaders }: WorldMapProps) => {
    const [selectedLeader, setSelectedLeader] = useState<{
        region: string;
        name: string;
        picture: string | null;
        streak: number;
        coins: number;
        weeklyXP: number;
    } | null>(null);
    const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
    const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null);

    const handleZoomIn = () => {
        if (position.zoom >= 5) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
    };

    const handleZoomOut = () => {
        if (position.zoom <= 1) return;
        setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
    };

    const handleMoveEnd = (position: { coordinates: [number, number], zoom: number }) => {
        setPosition(position);
    };

    const handleAvatarClick = useCallback((e: React.MouseEvent, region: string, leader: { name: string; picture: string | null; streak: number; coins: number; weeklyXP: number }) => {
        e.stopPropagation(); // prevent map click behind it
        onSelectRegion(region); // still select the region

        // Trigger a localized confetti explosion from the click location!
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 80,
            spread: 80,
            origin: { x, y },
            colors: ['#fcd34d', '#818cf8', '#c084fc', '#fdf4ff'], // gold, indigo, purple, pink
            disableForReducedMotion: true,
            zIndex: 100
        });

        // Show info dialog
        setSelectedLeader({ region, ...leader });
    }, [onSelectRegion]);

    return (
        <div className="w-full h-[250px] sm:h-[350px] relative bg-cyan-100 rounded-3xl overflow-hidden shadow-inner border-2 border-cyan-300 mb-6 cursor-grab active:cursor-grabbing">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 180, center: [0, 20] }}
                className="w-full h-full"
            >
                <ZoomableGroup
                    center={position.coordinates}
                    zoom={position.zoom}
                    maxZoom={5}
                    onMoveEnd={handleMoveEnd}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                // Assign a deterministic dark color based on the geo key
                                const colorIndex = geo.rsmKey.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % REGION_COLORS.length;
                                const fillColor = REGION_COLORS[colorIndex];
                                // Slightly lighten on hover
                                const hoverColor = `${fillColor}cc`;
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={fillColor}
                                        stroke="#cffafe" // cyan-100 (ocean color borders match)
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: hoverColor, outline: "none", transition: "all 250ms" },
                                            pressed: { outline: "none" },
                                        }}
                                        onMouseEnter={(e) => {
                                            if (geo.properties?.name) {
                                                setTooltip({ name: geo.properties.name, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        onMouseMove={(e) => {
                                            if (tooltip && geo.properties?.name) {
                                                setTooltip({ name: geo.properties.name, x: e.clientX, y: e.clientY });
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            setTooltip(null);
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {Object.entries(regionalLeaders).map(([region, leader], idx) => {
                        const isActive = region === activeRegion;
                        const isTopRegion = !!leader;
                        const regionColor = REGION_COLORS[idx % REGION_COLORS.length];
                        const coordinates = COUNTRY_CENTERS[region] || [0, 0];
                        if (coordinates[0] === 0 && coordinates[1] === 0) return null; // Skip if unknown coords

                        return (
                            <Marker key={region} coordinates={coordinates} onClick={() => onSelectRegion(region)} className="cursor-pointer">
                                {isTopRegion && leader ? (
                                    // User's avatar hovering over the region
                                    <foreignObject x="-30" y="-60" width="60" height="70" className="overflow-visible pointer-events-none">
                                        <div
                                            className="animate-bounce-3x relative flex flex-col items-center group-hover:scale-125 transition-transform duration-300 cursor-pointer pointer-events-auto"
                                            onClick={(e) => handleAvatarClick(e, region, leader)}
                                        >
                                            {/* Crown / Rank indicator */}
                                            <div className="absolute -top-3 text-xs items-center justify-center font-black bg-gradient-to-r from-amber-300 to-yellow-500 text-yellow-900 px-2 py-0.5 rounded shadow-lg z-10 animate-pulse border border-yellow-200 shadow-yellow-500/50">
                                                #1
                                            </div>
                                            {/* Avatar */}
                                            {leader.picture && (leader.picture.startsWith('http') || leader.picture.startsWith('/') || leader.picture.includes('.')) ? (
                                                <img src={leader.picture} alt="Top Player" className="w-12 h-12 rounded-full border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)] object-cover bg-white" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)] bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-lg">
                                                    {leader.picture || leader.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {/* Drop shadow indicator on the "ground" */}
                                            <div className="absolute -bottom-3 w-6 h-1.5 bg-black/20 rounded-[100%] blur-[2px]"></div>
                                        </div>
                                    </foreignObject>
                                ) : (
                                    // Regular region indicator dot
                                    <circle
                                        r={isActive ? 8 : 4}
                                        fill={isActive ? regionColor : `${regionColor}99`} // Use hex+alpha for inactive
                                        stroke="#fff"
                                        strokeWidth={isActive ? 2 : 1}
                                        style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
                                    />
                                )}
                                {/* Region label */}
                                <text
                                    textAnchor="middle"
                                    y={isTopRegion ? 15 : (isActive ? 18 : 14)}
                                    style={{
                                        fontFamily: "system-ui, sans-serif",
                                        fill: isActive ? regionColor : "#64748b",
                                        fontSize: isActive ? "12px" : "9px",
                                        fontWeight: isActive ? "900" : "700",
                                        pointerEvents: "none",
                                        transition: "all 0.3s ease"
                                    }}
                                >
                                    {region}
                                </text>

                                {/* Active connection ping effect */}
                                {isActive && !isTopRegion && (
                                    <circle
                                        r={16}
                                        fill="none"
                                        stroke={regionColor}
                                        strokeWidth={1.5}
                                        className="animate-ping"
                                        style={{ transformOrigin: "center" }}
                                    />
                                )}
                            </Marker>
                        );
                    })}
                </ZoomableGroup>
            </ComposableMap>

            {/* Map instructions overlay */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-purple-100/50 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm pointer-events-none">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-900">
                    {activeRegion === 'Global' || activeRegion === 'Other' ? 'Live Region Map' : `Region: ${activeRegion}`}
                </span>
            </div>

            {/* Map Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-purple-100/50 rounded-xl shadow-sm text-gray-700 hover:text-purple-700 hover:bg-white flex items-center justify-center font-bold text-xl transition-colors select-none"
                    aria-label="Zoom In"
                >
                    +
                </button>
                <button
                    onClick={handleZoomOut}
                    className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-purple-100/50 rounded-xl shadow-sm text-gray-700 hover:text-purple-700 hover:bg-white flex items-center justify-center font-bold text-xl transition-colors select-none"
                    aria-label="Zoom Out"
                >
                    −
                </button>
            </div>

            {/* Gamified Leader Info Dialog */}
            {selectedLeader && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedLeader(null)}>
                    <div className="bg-white rounded-3xl shadow-xl border border-purple-100 max-w-sm w-full overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-24 relative">
                            <button onClick={() => setSelectedLeader(null)} className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full w-8 h-8 flex items-center justify-center transition">✕</button>
                        </div>
                        <div className="px-6 pb-6 relative text-center">
                            {/* Big Avatar */}
                            <div className="flex justify-center -mt-12 mb-4">
                                {selectedLeader.picture && (selectedLeader.picture.startsWith('http') || selectedLeader.picture.startsWith('/') || selectedLeader.picture.includes('.')) ? (
                                    <img src={selectedLeader.picture} alt="Leader" className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black flex items-center justify-center text-4xl uppercase">
                                        {selectedLeader.picture || selectedLeader.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-1">{selectedLeader.name}</h3>
                            <p className="text-purple-600 font-bold uppercase tracking-widest text-xs mb-6">👑 #1 in {selectedLeader.region}</p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-purple-50 rounded-2xl p-3 border border-purple-100">
                                    <div className="text-2xl mb-1">🪙</div>
                                    <div className="font-black text-gray-900">{selectedLeader.coins.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Coins</div>
                                </div>
                                <div className="bg-yellow-50 rounded-2xl p-3 border border-yellow-100">
                                    <div className="text-2xl mb-1">⚡</div>
                                    <div className="font-black text-gray-900">{selectedLeader.streak} Days</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Win Streak</div>
                                </div>
                            </div>

                            <button onClick={() => setSelectedLeader(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">
                                Awesome!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Country Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 bg-gray-900/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1.5 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px] border border-gray-700 whitespace-nowrap"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    {tooltip.name}
                </div>
            )}
        </div >
    );
};

export default memo(WorldMap);
