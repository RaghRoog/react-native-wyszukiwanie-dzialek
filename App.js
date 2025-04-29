import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Dimensions, TextInput, Button, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import MapView, {Polygon} from 'react-native-maps';

export default function App() {

  let { width } = Dimensions.get('window')

  let mapRef = useRef(null) //referencja do mapy

  let [coords, setCoords] = useState([])

  let [parcelNr, setParcelNr] = useState('')

  let [canDrawPolygon, setCanDrawPolygon] = useState(false)

  let [errorMessage, setErrorMessage] = useState('')

  let [loading, setLoading] = useState(false)

  //pobieranie koordynatow
  function getCoords(parcelNr){
    setErrorMessage('')
    setLoading(true)
    fetch(`https://uldk.gugik.gov.pl/?request=GetParcelByIdOrNr&id=${parcelNr}&result=geom_wkt&srid=4326`)
      .then(res => res.text())
      .then(txt => {
        const match = txt.match(/\(+(.+?)\)+/)
        if(match){
          const coordsString = match[1]
          const processedCords = processCoords(coordsString)
          setCoords(processedCords)
          setCanDrawPolygon(true)
        }else{
          setErrorMessage('Nie wykryto działki o takim numerze.')
          setCoords([])
        }
      })
      .catch(err => {
        setErrorMessage('Błąd podczas pobierania danych.')
        setCoords([])
      })
      .finally(() => {
        setLoading(false)
      })
  }

  //przetwarzanie koordynatow
  function processCoords(coordsString){
    return coordsString.split(',').map(pair => {
      const [lng, lat] = pair.trim().split(' ').map(Number)
      return { latitude: lat, longitude: lng }
    })
  }

  useEffect(() => {
    if (mapRef.current && coords.length > 0) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      })
    }
  }, [coords])

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        
        <MapView
          ref={mapRef}
          style={{ width: width * 0.9, height: width * 0.9 }}
          mapType='hybrid'
          initialRegion={{
            latitude: 52.17167,
            longitude: 21.58987,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {canDrawPolygon && (
            <Polygon
              coordinates={coords}
              strokeColor="rgb(0, 255, 106)"
              fillColor="rgba(0, 255, 106, 0.13)"
              strokeWidth={2}
            />
          )}
        </MapView>

        {loading && (
          <ActivityIndicator style={styles.activityIndicator} size='large' color='#4dbee0'/>
        )}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
                
        <TextInput
          style={styles.textInput}
          placeholder='numer działki'
          onChangeText={setParcelNr}
        />

        <Button
          title='Szukaj działki'
          onPress={() => {
            Keyboard.dismiss()
            getCoords(parcelNr)
          }}
        />

        <StatusBar style="auto" />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    borderWidth: 2,
    borderColor: 'black',
    padding: 10,
    width: '90%',
    fontSize: 20
  },
  errorText: {
    color: 'red',
    width: '90%',
    fontSize: 20,
  },
  activityIndicator: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -25 }],
    zIndex: 100
  }
});
