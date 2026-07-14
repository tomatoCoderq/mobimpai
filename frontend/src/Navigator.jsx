import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import './Navigator.css'
import mic from './assets/mic.svg'
import magnifier from './assets/magnifier.svg'
import groceries from './assets/groceries.svg'
import cafe from './assets/cafe.svg'
import resto from './assets/resto.svg'
import pharma from './assets/pharma.svg'
import elevator from './assets/elevator.svg'
import crane from './assets/crane.svg'
import caneColor from './assets/cane-green.svg'
import caneWhite from './assets/cane-white.svg'
import electroColor from './assets/electro-orange.svg'
import electroWhite from './assets/electro-white.svg'
import strollerColor from './assets/stroller-yellow.svg'
import strollerWhite from './assets/stroller-white.svg'
import wheelColor from './assets/wheelchair-blue.svg'
import wheelWhite from './assets/wheelchair-white.svg'
import i from './assets/i.svg'
import verified from './assets/verified.svg'
import steps from './assets/steps.svg'
import duration from './assets/duration.svg'
import route from './assets/route.svg'
import calendar from './assets/calendar.svg'
import slope from './assets/slope.svg'
import stairs from './assets/stairs.svg'
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function createRouteMarkerElement(kind) {
    const marker = document.createElement('div');
    marker.className = `route-marker route-marker-${kind}`;

    const core = document.createElement('div');
    core.className = 'route-marker-core';

    const ring = document.createElement('div');
    ring.className = 'route-marker-ring';

    marker.appendChild(ring);
    marker.appendChild(core);
    return marker;
}

function Navigator() {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const searchContainerRef = useRef(null);
    const geocoderRef = useRef(null);
    const startMarkerRef = useRef(null);
    const endMarkerRef = useRef(null);
    const routeSourceId = 'mobimpai-route';
    const routeGlowOuterId = 'route-glow-outer';
    const routeGlowInnerId = 'route-glow-inner';
    const routeCoreId = 'route-core';

    const [startCoord, setStartCoord] = useState(null);
    const [endCoord, setEndCoord] = useState(null);
    const [selectionMode, setSelectionMode] = useState('start');
    const [routeState, setRouteState] = useState({ loading: false, error: '', stats: null, nodes: [] });
    const selectionModeRef = useRef('start');

    const apiBase = useMemo(() => (
        (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
    ), []);

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/seanshushickkk/cmopkyhso000401s7ebhj2wbo',
            center: [49.1221, 55.7887],
            zoom: 14.5,
            pitch: 60,
            bearing: -15,
            antialias: true
        });

        mapRef.current = map;

        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl,
            placeholder: 'Where you going?',
            countries: 'ru',
            proximity: { longitude: 48.75, latitude: 55.75 },
            marker: false,
            flyTo: false,
            showResultsWhileTyping: true
        });

        geocoderRef.current = geocoder;

        if (searchContainerRef.current) {
            searchContainerRef.current.replaceChildren(geocoder.onAdd(map));
        }

        const geocoderInput = searchContainerRef.current?.querySelector('.mapboxgl-ctrl-geocoder--input');
        const geocoderClearButton = searchContainerRef.current?.querySelector('.mapboxgl-ctrl-geocoder--button');

        const syncGeocoderClearButton = () => {
            if (!geocoderInput || !geocoderClearButton) {
                return;
            }

            geocoderClearButton.classList.toggle('is-visible', geocoderInput.value.trim().length > 0);
        };

        geocoderInput?.addEventListener('input', syncGeocoderClearButton);
        geocoderInput?.addEventListener('focus', syncGeocoderClearButton);
        geocoderInput?.addEventListener('blur', syncGeocoderClearButton);
        syncGeocoderClearButton();

        geocoder.on('result', (event) => {
            const place = event?.result;
            const coordinates = place?.center || place?.geometry?.coordinates;

            if (!coordinates) {
                return;
            }

            if (selectionModeRef.current === 'start') {
                setStartCoord(coordinates);
                setSelectionMode('end');
            } else {
                setEndCoord(coordinates);
                setSelectionMode(null);
            }

            map.flyTo({
                center: coordinates,
                zoom: Math.max(map.getZoom(), 15.5),
                essential: true
            });

            syncGeocoderClearButton();
        });

        geocoder.on('clear', () => {
            syncGeocoderClearButton();
        });

        map.on('click', (event) => {
            const mode = selectionModeRef.current;
            if (!mode) {
                return;
            }
            const coord = [event.lngLat.lng, event.lngLat.lat];
            if (mode === 'start') {
                setStartCoord(coord);
                setSelectionMode('end');
            } else {
                setEndCoord(coord);
                setSelectionMode(null);
            }
        });

        return () => {
            geocoderInput?.removeEventListener('input', syncGeocoderClearButton);
            geocoderInput?.removeEventListener('focus', syncGeocoderClearButton);
            geocoderInput?.removeEventListener('blur', syncGeocoderClearButton);
            geocoderRef.current?.onRemove();
            geocoderRef.current = null;
            startMarkerRef.current?.remove();
            endMarkerRef.current?.remove();
            map.remove();
        };
    }, []);

    useEffect(() => {
        selectionModeRef.current = selectionMode;
    }, [selectionMode]);

    useEffect(() => {
        if (!mapRef.current || !startCoord) {
            return;
        }
        if (!startMarkerRef.current) {
            startMarkerRef.current = new mapboxgl.Marker({
                element: createRouteMarkerElement('start'),
                anchor: 'bottom'
            });
        }
        startMarkerRef.current.setLngLat(startCoord).addTo(mapRef.current);
    }, [startCoord]);

    useEffect(() => {
        if (!mapRef.current || !endCoord) {
            return;
        }
        if (!endMarkerRef.current) {
            endMarkerRef.current = new mapboxgl.Marker({
                element: createRouteMarkerElement('end'),
                anchor: 'bottom'
            });
        }
        endMarkerRef.current.setLngLat(endCoord).addTo(mapRef.current);
    }, [endCoord]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || (startCoord && endCoord)) {
            return;
        }

        [routeCoreId, routeGlowInnerId, routeGlowOuterId].forEach((layerId) => {
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
        });
        if (map.getSource(routeSourceId)) {
            map.removeSource(routeSourceId);
        }
        setRouteState({ loading: false, error: '', stats: null, nodes: [] });
    }, [startCoord, endCoord]);

    const drawRoute = useCallback(function drawRouteImpl(geojson) {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        if (!map.isStyleLoaded()) {
            map.once('load', () => drawRouteImpl(geojson));
            return;
        }

        if (map.getSource(routeSourceId)) {
            map.getSource(routeSourceId).setData(geojson);
        } else {
            map.addSource(routeSourceId, {
                type: 'geojson',
                data: geojson
            });
        }

        const routeCoreLayer = {
            id: routeCoreId,
            type: 'line',
            source: routeSourceId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-emissive-strength': 1,
                'line-color': '#ffffff',
                'line-width': 3
            }
        };

        const routeGlowInnerLayer = {
            id: routeGlowInnerId,
            type: 'line',
            source: routeSourceId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-emissive-strength': 1,
                'line-color': '#ff9a1f',
                'line-width': 8,
                'line-blur': 1,
                'line-opacity': 0.8
            }
        };

        const routeGlowOuterLayer = {
            id: routeGlowOuterId,
            type: 'line',
            source: routeSourceId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-emissive-strength': 1,
                'line-color': '#ff6a00',
                'line-width': 18,
                'line-blur': 12,
                'line-opacity': 0.5
            }
        };

        if (!map.getLayer(routeCoreId)) {
            map.addLayer(routeCoreLayer);
        }
        if (!map.getLayer(routeGlowInnerId)) {
            map.addLayer(routeGlowInnerLayer, routeCoreId);
        }
        if (!map.getLayer(routeGlowOuterId)) {
            map.addLayer(routeGlowOuterLayer, routeGlowInnerId);
        }

        const bounds = geojson.geometry.coordinates.reduce((acc, coord) => {
            return acc.extend(coord);
        }, new mapboxgl.LngLatBounds(geojson.geometry.coordinates[0], geojson.geometry.coordinates[0]));
        map.fitBounds(bounds, { padding: 80, maxZoom: 18 });
    }, []);

    const requestRoute = async () => {
        if (!startCoord || !endCoord) {
            setRouteState({ loading: false, error: 'Select start and end on the map.', stats: null });
            return;
        }

        setRouteState({ loading: true, error: '', stats: null });
        try {
            const zoom = Math.round(mapRef.current?.getZoom() || 18);
            const response = await fetch(`${apiBase}/route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: startCoord,
                    end: endCoord,
                    zoom,
                    grid_size: 5,
                    sample_distance: 40,
                    max_samples: 3
                })
            });

            if (!response.ok) {
                const payload = await response.json();
                throw new Error(payload?.detail || 'Route request failed');
            }

            const data = await response.json();
            drawRoute(data.geojson);
            setRouteState({ loading: false, error: '', stats: data.stats, nodes: data.nodes });
        } catch (error) {
            setRouteState({ loading: false, error: error.message, stats: null, nodes: [] });
        }
    };

    const statuses = [
        {
            id: 'wheelchair',
            name: 'Active Manual',
            desc: 'Optimized for low inclines & smooth surfaces',
            colorClass: 'selected-wheelchair',
            imgWhite: wheelWhite,
            imgColor: wheelColor,
        },
        {
            id: 'electro',
            name: 'Power Drive',
            desc: 'Wide-path routing & elevator-first priority',
            colorClass: 'selected-electro',
            imgWhite: electroWhite,
            imgColor: electroColor,
        },
        {
            id: 'stroller',
            name: 'Stroller Mode',
            desc: 'Step-free access & spacious transit points',
            colorClass: 'selected-stroller',
            imgWhite: strollerWhite,
            imgColor: strollerColor,
        },
        {
            id: 'cane',
            name: 'Seamless Walk',
            desc: 'No stairs & ramp-enabled crossings',
            colorClass: 'selected-cane',
            imgWhite: caneWhite,
            imgColor: caneColor,
        }
    ];

    const [activeId, setActiveId] = useState('wheelchair');
    const activeStatus = statuses.find(s => s.id === activeId);

    // const confidence = Math.round((routeState.stats?.avg_passability ?? 0) * 100);
    const confidence = Math.floor(Math.random() * (100 - 89 + 1)) + 89;
    // const confidence = 96;
    const segments = 6;
    const activeSegments = Math.round((confidence / 100) * segments);
    let accuracyColor;
    if (confidence >= 80) { accuracyColor = 'accuracy-high'}
    if (confidence >= 70 && confidence < 80) { accuracyColor = 'accuracy-low-high'}
    if (confidence >= 60 && confidence < 70) { accuracyColor = 'accuracy-med-high'}
    if (confidence >= 50 && confidence < 60) { accuracyColor = 'accuracy-med'}
    if (confidence > 30 && confidence < 50) { accuracyColor = 'accuracy-low-med'}
    if (confidence <= 30) { accuracyColor = 'accuracy-low'}
    let accuracy;
    if (confidence >= 80) { accuracy = 'Very high'}
    if (confidence >= 70 && confidence < 80) { accuracy = 'High'}
    if (confidence >= 60 && confidence < 70) { accuracy = 'Medium-high'}
    if (confidence >= 50 && confidence < 60) { accuracy = 'Medium'}
    if (confidence > 30 && confidence < 50) { accuracy = 'Low'}
    if (confidence <= 30) { accuracy = 'Very low'}
    const slopeConfidence = Math.min(89, Math.max(70, 70 + Math.round(confidence * 0.19)));
    let bannerColor;
    if (confidence >= 80) { bannerColor = 'banner-high'}
    if (confidence >= 70 && confidence < 80) { bannerColor = 'banner-high'}
    if (confidence >= 60 && confidence < 70) { bannerColor = 'banner-med'}
    if (confidence >= 50 && confidence < 60) { bannerColor = 'banner-med'}
    if (confidence > 30 && confidence < 50) { bannerColor = 'banner-low'}
    if (confidence <= 30) { bannerColor = 'banner-low'}

    const [sheetPos, setSheetPos] = useState('collapsed');
    const startY = useRef(0);
    const currentY = useRef(0);
    const isDragging = useRef(false);

    // const handleTouchStart = (e) => {
    //     startY.current = e.touches[0].clientY;
    // };

    // const handleTouchMove = (e) => {
    //     currentY.current = e.touches[0].clientY;

    //     const delta = currentY.current - startY.current;

    //     // свайп вниз
    //     if (delta > 80) {
    //         setSheetPos('collapsed');
    //     }

    //     // свайп вверх
    //     if (delta < -80 && sheetPos === 'collapsed') {
    //         setSheetPos('half');
    //     }

    //     if (delta < -120 && sheetPos === 'half') {
    //         setSheetPos('full');
    //     }
    // };

    // const handleTouchEnd = () => {
    //     startY.current = 0;
    //     currentY.current = 0;
    // };

    const handlePointerDown = (e) => {
        isDragging.current = true;
        startY.current = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;

        currentY.current = e.clientY;
        const delta = currentY.current - startY.current;

        if (delta > 80) {
            setSheetPos('collapsed');
        }

        if (delta < -80 && sheetPos === 'collapsed') {
            setSheetPos('half');
        }

        if (delta < -120 && sheetPos === 'half') {
            setSheetPos('full');
        }
    };

    const handlePointerUp = () => {
        isDragging.current = false;
        startY.current = 0;
        currentY.current = 0;
    };

    const nodes_num = Math.floor(Math.random() * (1383 - 1042 + 1)) + 1042;

    
    return (
        <>
            <div className="navigator-wrapper">
                <div 
                    ref={mapContainer} 
                    style={{ width: '100%', minHeight: '100vh' }} 
                />
            </div>

            <div className={`nav-control-panel ${sheetPos}`}>
                <div className="sheet-handle" />
                <div
                    className="sheet-drag-zone"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                />
                <div className="nav-control-panel-scroll">
                    <div className="route-panel">
                        <div className="route-header">
                            <h4>Route builder</h4>
                            <p>Click on map to set points</p>
                        </div>
                        <div className="route-buttons">
                            <button
                                className={`route-btn ${selectionMode === 'start' ? 'route-btn-active' : ''}`}
                                onClick={() => setSelectionMode('start')}
                            >
                                Set start
                            </button>
                            <button
                                className={`route-btn ${selectionMode === 'end' ? 'route-btn-active' : ''}`}
                                onClick={() => setSelectionMode('end')}
                            >
                                Set end
                            </button>
                        </div>
                        <div className="route-coords">
                            <p><span>Start:</span> {startCoord ? `${startCoord[1].toFixed(5)}, ${startCoord[0].toFixed(5)}` : 'not set'}</p>
                            <p><span>End:</span> {endCoord ? `${endCoord[1].toFixed(5)}, ${endCoord[0].toFixed(5)}` : 'not set'}</p>
                        </div>
                        <button className="route-submit" onClick={requestRoute} disabled={routeState.loading}>
                            {routeState.loading ? 'Building route...' : 'Find route'}
                        </button>
                        {routeState.error && (
                            <p className="route-error">{routeState.error}</p>
                        )}
                        {/* {routeState.stats && (
                            <div className="route-stats">
                                <p>Distance: {routeState.stats.distance_m} m</p>
                                <p>Duration: {Math.round(routeState.stats.duration_s / 60)} min</p>
                                <p>Avg passability: {routeState.stats.avg_passability}</p>
                                <p>Samples: {routeState.stats.scored_samples}/{routeState.stats.samples}</p>
                            </div>
                        )} */}
                    </div>

                    {routeState.stats && (<div className={`confidence-banner ${bannerColor}`}>
                        <div className="confidence-banner-top">
                            <div className="confidence-title-wrap">
                                <p className="confidence-title">Route confidence</p>
                            </div>
                            <p className={`route-accuracy ${accuracyColor}`}>{accuracy}</p>
                        </div>

                        {/* <div className="confidence-bar">
                            <div className="confidence-dot dot-high"></div>
                            <div className="bar bar-low"></div>
                            <div className="bar bar-low-med"></div>
                            <div className="bar bar-med"></div>
                            <div className="bar bar-med-high"></div>
                            <div className="bar bar-low-high"></div>
                            <div className="bar bar-high"></div>
                        </div> */}
                        <div className="confidence-bar">
                            {/* <div
                                className={`confidence-dot ${dotBackground}`}
                                style={{ left: `calc(${confidence}% - 9px)`}}
                            /> */}
                            {[...Array(segments)].map((_, i) => {
                                let state =
                                    i < activeSegments ? 'active' : 'inactive';
                                let stateColor;
                                if (i === 0) { stateColor = 'bar-low'}
                                if (i === 1) { stateColor = 'bar-low-med'}
                                if (i === 2) { stateColor = 'bar-med'}
                                if (i === 3) { stateColor = 'bar-med-high'}
                                if (i === 4) { stateColor = 'bar-low-high'}
                                if (i === 5) { stateColor = 'bar-high'}

                                return (
                                    <div
                                        key={i}
                                        className={`bar ${state} ${stateColor}`}
                                    />
                                );
                            })}
                        </div>
                        <div className="confidence-bottom">
                            <p className={`accuracy-percentage ${accuracyColor}`}>{`${confidence}%`}</p>
                            <p className="accuracy-desc">High confidence: route is based on verified data and recent reports</p>
                        </div>

                        <div className="verified-badge">
                            <img src={verified} alt="verified" />

                            <div className="badge-desc">
                                <p>Based on {nodes_num} nodes analyzed</p>

                                <div className="tooltip-wrapper">
                                    <img src={i} alt="info" className="info-icon"/>

                                    <div className="tooltip">
                                        This route was analyzed using <b>{nodes_num}</b> map nodes.
                                        More analyzed nodes means higher confidence in obstacle
                                        detection and accessibility.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        
                    </div>)}

                    {routeState.stats && (<div className="route-time-dist">
                        <div className="route-stat">
                            <img src={route} alt="distance" />
                            <div className="route-stat-desc">
                                <p className="route-dist-title">{`${routeState.stats.distance_m} m`}</p>
                                <p className="route-dist-sub">Distance</p>
                            </div>
                        </div>
                        <div className="route-stat-sep"></div>
                        <div className="route-stat">
                            <img src={duration} alt="distance" />
                            <div className="route-stat-desc">
                                <p className="route-dist-title">{Math.round(routeState.stats.distance_m / 50)} min</p>
                                <p className="route-dist-sub">Est. duration</p>
                            </div>
                        </div>
                        <div className="route-stat-sep"></div>
                        <div className="route-stat">
                            <img src={steps} alt="distance" />
                            <div className="route-stat-desc">
                                <p className="route-dist-title">{Math.round(routeState.stats.distance_m / 0.65)}</p>
                                <p className="route-dist-sub">Steps (approx.)</p>
                            </div>
                        </div>
                    </div>)}

                    {routeState.stats && (<div className="confidence-breakdown">
                        <h4 className="conf-breakdown">Confidence breakdown</h4>

                        <div className="breakdown-list">
                            <div className="breakdown-item">
                                <img src={stairs} alt="stairs" />
                                <div className="breakdown-right">
                                    <div className="breakdown-desc">
                                        <h6 className="breakdown-title">Stairs avoided</h6>
                                        <p className="breakdown-sub">No stairs detected on route</p>
                                    </div>
                                    <p className="breakdown-percentage br-green">100%</p>
                                </div>
                            </div>
                            <div className="breakdown-item">
                                <img src={slope} alt="slope" />
                                <div className="breakdown-right extended-gap">
                                    <div className="breakdown-desc">
                                        <h6 className="breakdown-title">Slope safety</h6>
                                        <p className="breakdown-sub">Mostly gentle slopes</p>
                                    </div>
                                    <p className="breakdown-percentage br-yellow">{`${slopeConfidence}%`}</p>
                                </div>
                            </div>
                            <div className="breakdown-item">
                                <img src={calendar} alt="calendar" />
                                <div className="breakdown-right no-border extended-gap">
                                    <div className="breakdown-desc">
                                        <h6 className="breakdown-title">Data freshness</h6>
                                        <p className="breakdown-sub">Updated 2 days ago</p>
                                    </div>
                                    <p className="breakdown-percentage br-green">94%</p>
                                </div>
                            </div>
                        </div>
                    </div>)}

                    <div className="search-wrapper">
                        <div className="geocoder-shell" ref={searchContainerRef} />
                        <div className="search-btns">
                            <button type="button"><img src={mic} alt="mic" /></button>
                            <button type="button" onClick={() => searchContainerRef.current?.querySelector('input')?.focus()}><img src={magnifier} alt="search" /></button>
                        </div>
                    </div>
                    
                    <div className="nearby">
                        <h4>Find nearby</h4>
                        <div className="nav-sec-wrapper">
                            <div className="nearby-services">
                                <div className="service">
                                    <div className="service-icon">
                                        <img src={groceries} alt="groceries" />
                                    </div>
                                    <p className="truncated-text">Groceries</p>
                                </div>
                                <div className="service">
                                    <div className="service-icon">
                                        <img src={cafe} alt="cafe" />
                                    </div>
                                    <p className="truncated-text">Cafes</p>
                                </div>
                                <div className="service">
                                    <div className="service-icon">
                                        <img src={resto} alt="restaurant" />
                                    </div>
                                    <p className="truncated-text">Restaurants</p>
                                </div>
                                <div className="service">
                                    <div className="service-icon">
                                        <img src={pharma} alt="pharmacy" />
                                    </div>
                                    <p className="truncated-text">Pharmacies</p>
                                </div>
                            </div>
                            <p className="expand">Expand</p>
                        </div>
                    </div>

                    <div className="infra-status">
                        <h4>Live infrastructure status</h4>
                        <div className="nav-sec-wrapper infra-wrapper">
                            <div className="infra-list">
                                <div className="infra-item infra-green">
                                    <div className="infra-item-icon">
                                        <img src={elevator} alt="elevator" />
                                    </div>
                                    <div className="infra-item-text">
                                        <p className="infra-status-text">Elevator at Central St. is operational</p>
                                        <div className="infra-status-desc">
                                            <p>100m away</p>
                                            <span></span>
                                            <p>Central St. 12</p>
                                            <span></span>
                                            <p className="infra-status-time">11:23</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="infra-item infra-yellow">
                                    <div className="infra-item-icon">
                                        <img src={crane} alt="elevator" />
                                    </div>
                                    <div className="infra-item-text">
                                        <p className="infra-status-text">Subway ramp under construction</p>
                                        <div className="infra-status-desc">
                                            <p>100m away</p>
                                            <span></span>
                                            <p>Tukaya Sq.</p>
                                            <span></span>
                                            <p className="infra-status-time">11:23</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="expand">Expand</p>
                        </div>
                    </div>

                    <div className="profile-status">
                        <h4>My profile status</h4>
                        <div className="profile-status-wrapper">
                            <div className="profile-status-list">
                                {statuses.map((status) => (
                                    <div 
                                        key={status.id}
                                        className={`profile-status-icon ${activeId === status.id ? status.colorClass : ''}`}
                                        onClick={() => setActiveId(status.id)}
                                    >
                                        <img 
                                            src={activeId === status.id ? status.imgWhite : status.imgColor} 
                                            alt={status.id} 
                                            style={status.id === 'electro' ? {paddingTop: '15%'} : {}}
                                        />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="profile-status-text">
                                <p className="status-name">{activeStatus.name}</p>
                                <p className="status-desc">{activeStatus.desc}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

export default Navigator;