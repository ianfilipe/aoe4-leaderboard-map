import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'

import countries from '../countries.json'
import axios from 'axios'

mapboxgl.accessToken =
  'pk.eyJ1Ijoic3NpYW5maWxpcGUiLCJhIjoiY2wyeGZ0bmRsMDBmYzNqczByZWt3OXNxMyJ9.y18WiuK79uwBKCSOKHJx2A'

export default function Map() {
  async function getData() {
    const res = await fetch('https://aoe4world.com/api/v0/leaderboards/rm_solo')
    return res.json()
  }

  const mapContainerRef = useRef('map')

  const [lng, setLng] = useState(-54)
  const [lat, setLat] = useState(-11)
  const [zoom, setZoom] = useState(5)

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom,
    })

    axios('https://aoe4world.com/api/v0/leaderboards/rm_solo').then(
      (response) => {
        const data = response.data
        const totalCount = data.total_count
        for (let index = 1; index < 50; index++) {
          axios(
            `https://aoe4world.com/api/v0/leaderboards/rm_solo?page=${index}`,
          ).then((response) => {
            const countriesList = countries.features
            const data = response.data
            const players = data.players
            countriesList.forEach((country, index) => {
              const test = players.filter(
                (player) =>
                  country.properties.ISO === player.country.toUpperCase(),
              ).length
              countriesList[index].properties.COUNT_PLAYERS = test
            })
          })
        }
      },
    )

    map.on('load', () => {
      map.addSource('countries', {
        type: 'geojson',
        data: countries,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
      })

      map.addLayer({
        id: 'countries-layer',
        type: 'circle',
        source: 'countries',
        paint: {
          'circle-color': [
            'step',
            ['get', 'COUNT_PLAYERS'],
            '#51bbd6',
            1,
            '#f1f075',
            3,
            '#f28cb1',
          ],
          'circle-radius': ['step', ['get', 'COUNT_PLAYERS'], 20, 1, 30, 3, 40],
        },
      })

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'countries',
        layout: {
          'text-field': ['get', 'COUNT_PLAYERS'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
      })

      // map.on('click', 'countries-layer', (e) => {
      //   new mapboxgl.Popup()
      //     .setLngLat(e.lngLat)
      //     .setHTML(e.features[0].properties.COUNTRY)
      //     .addTo(map)
      // })

      // map.on('mouseenter', 'countries-layer', () => {
      //   map.getCanvas().style.cursor = 'pointer'
      // })

      // map.on('mouseleave', 'countries-layer', () => {
      //   map.getCanvas().style.cursor = ''
      // })
    })
  }, [])

  return (
    <section className="overflow-hidden">
      <div ref={mapContainerRef} className="h-screen" />
    </section>
  )
}
