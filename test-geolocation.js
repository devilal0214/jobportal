// Test script to verify geolocation functionality
const checkGeolocation = async () => {
  try {
    // Test the geolocation API endpoint
    const response = await fetch('http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon,query')
    const data = await response.json()
    
    console.log('IP Geolocation Test Result:')
    console.log('Status:', data.status)
    console.log('Country:', data.country)
    console.log('State/Region:', data.regionName)
    console.log('City:', data.city)
    console.log('Latitude:', data.lat)
    console.log('Longitude:', data.lon)
    console.log('IP Address:', data.query)
    
    if (data.status === 'success') {
      console.log('✅ Geolocation API is working correctly!')
    } else {
      console.log('❌ Geolocation API error:', data.message)
    }
  } catch (error) {
    console.error('❌ Error testing geolocation:', error)
  }
}

checkGeolocation()
