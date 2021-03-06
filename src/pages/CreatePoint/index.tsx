import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

import api from '../../services/api';

import './styles.css';

import logo from '../../assets/logo.svg';

interface CollectItems {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEStates {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECities {
  nome: string;
}

interface States {
  id: number;
  initials: string;
  name: string;
}

const CreatePoint = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });

  const [collectItems, setItems] = useState<CollectItems[]>([]);
  const [states, setStates] = useState<States[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [selectedState, setSelectedState] = useState('0');
  const [selectedCity, setSelectedCity] = useState('0');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);

  const history = useHistory();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setInitialPosition([latitude, longitude]);
    });
  },[]);

  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data);
    })
  },[]);

  useEffect(() => {
    axios.get<IBGEStates[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(response => {
      const returnedStates = response.data.map(state => ({id: state.id, initials: state.sigla, name: state.nome}));
      setStates(returnedStates);
    })
  },[]);

  useEffect(() => {
    axios.get<IBGECities[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`).then(response => {
      const stateCities = response.data.map(city => city.nome);
      setCities(stateCities);
    })
  }, [selectedState]);

  function handleSelectedState(event: ChangeEvent<HTMLSelectElement>) {
    const selectedState = event.target.value;
    setSelectedState(selectedState);
  }

  function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
    const selectedCity = event.target.value;
    setSelectedCity(selectedCity);
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([
      event.latlng.lat,
      event.latlng.lng,
    ]);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData({...formData, [name]: value});
  }

  function handleSelectedItem(itemId: number) {
    const alreadySelected = selectedItems.findIndex((item) => item === itemId);

    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter((item) => item !== itemId);

      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const federalState = selectedState;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;

    const data = {
      name,
      email,
      whatsapp,
      state: federalState,
      city,
      latitude,
      longitude,
      collectItems: items
    };

    await api.post('points', data);

    alert('Collect point created!');

    history.push('/');
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta"></img>
        <Link to="/">
          <FiArrowLeft></FiArrowLeft>
          Back to home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Adding a collect point</h1>

        <fieldset>
          <legend>
            <h2>
              Main Data
            </h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Entity Name</label>
            <input 
            type="text" 
            name="name" 
            id="name"
            onChange={handleInputChange}/>
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="name">Email</label>
              <input 
              type="text" 
              name="email" 
              id="email"
              onChange={handleInputChange}/>
            </div>
            <div className="field">
              <label htmlFor="name">Whatsapp</label>
              <input 
              type="text" 
              name="whatsapp" 
              id="whatsapp"
              onChange={handleInputChange}/>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>
              Address
            </h2>
            <span>Select address on the map</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png">
            </TileLayer>
            
            <Marker position={selectedPosition}></Marker>
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="state">State</label>
              <select name="state" id="state" value={selectedState} onChange={handleSelectedState}>
                <option value="0">Select a state</option>
                {states.map(state => (
                  <option key={state.id} value={state.initials}>{state.initials} - {state.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">City</label>
              <select name="city" id="city" value={selectedCity} onChange={handleSelectedCity}>
                <option value="0">Select a city</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>
              Collected items
            </h2>
            <span>Select one or more items below</span>
          </legend>

          <ul className="items-grid">
            {collectItems.map(item => (
              <li 
                key={item.id}
                onClick={() => handleSelectedItem(item.id)}
                className={selectedItems.includes(item.id) ? 'selected' : ''}
              >
                <img src={item.image_url} alt={item.title}></img>
                <span>{item.title}</span>
              </li>
            
              )
            )}
            
          </ul>
        </fieldset>

        <button type="submit">
          Save collect point
        </button>
      </form>
    </div>
  );
}

export default CreatePoint;