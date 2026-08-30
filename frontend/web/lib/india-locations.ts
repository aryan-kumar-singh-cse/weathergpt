/**
 * Comprehensive Indian States & Cities Dataset for WeatherGPT
 */

export interface CityInfo {
  name: string
  name_local?: string
  lat: number
  lng: number
  district?: string
}

export interface StateInfo {
  state: string
  state_local?: string
  cities: CityInfo[]
}

export const INDIA_LOCATIONS: StateInfo[] = [
  {
    state: "Maharashtra",
    state_local: "महाराष्ट्र",
    cities: [
      { name: "Mumbai", name_local: "मुंबई", lat: 19.0760, lng: 72.8777, district: "Mumbai" },
      { name: "Pune", name_local: "पुणे", lat: 18.5204, lng: 73.8567, district: "Pune" },
      { name: "Nagpur", name_local: "नागपूर", lat: 21.1458, lng: 79.0882, district: "Nagpur" },
      { name: "Nashik", name_local: "नाशिक", lat: 19.9975, lng: 73.7898, district: "Nashik" },
      { name: "Chhatrapati Sambhajinagar", name_local: "छत्रपती संभाजीनगर", lat: 19.8762, lng: 75.3433, district: "Aurangabad" },
      { name: "Thane", name_local: "ठाणे", lat: 19.2183, lng: 72.9781, district: "Thane" },
      { name: "Kolhapur", name_local: "कोल्हापूर", lat: 16.7050, lng: 74.2433, district: "Kolhapur" },
      { name: "Solapur", name_local: "सोलापूर", lat: 17.6599, lng: 75.9064, district: "Solapur" },
      { name: "Amravati", name_local: "अमरावती", lat: 20.9374, lng: 77.7796, district: "Amravati" },
      { name: "Nanded", name_local: "नांदेड", lat: 19.1383, lng: 77.3210, district: "Nanded" },
    ]
  },
  {
    state: "Delhi",
    state_local: "दिल्ली",
    cities: [
      { name: "New Delhi", name_local: "नई दिल्ली", lat: 28.6139, lng: 77.2090, district: "New Delhi" },
      { name: "North Delhi", name_local: "उत्तरी दिल्ली", lat: 28.7383, lng: 77.1706, district: "North Delhi" },
      { name: "South Delhi", name_local: "दक्षिणी दिल्ली", lat: 28.5355, lng: 77.2410, district: "South Delhi" },
      { name: "East Delhi", name_local: "पूर्वी दिल्ली", lat: 28.6280, lng: 77.2959, district: "East Delhi" },
      { name: "Dwarka", name_local: "द्वारका", lat: 28.5921, lng: 77.0460, district: "South West Delhi" },
    ]
  },
  {
    state: "Karnataka",
    state_local: "ಕರ್ನಾಟಕ",
    cities: [
      { name: "Bengaluru", name_local: "ಬೆಂಗಳೂರು", lat: 12.9716, lng: 77.5946, district: "Bengaluru Urban" },
      { name: "Mysuru", name_local: "ಮೈಸೂರು", lat: 12.2958, lng: 76.6394, district: "Mysuru" },
      { name: "Hubballi-Dharwad", name_local: "ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ", lat: 15.3647, lng: 75.1240, district: "Dharwad" },
      { name: "Mangaluru", name_local: "ಮಂಗಳೂರು", lat: 12.9141, lng: 74.8560, district: "Dakshina Kannada" },
      { name: "Belagavi", name_local: "ಬೆಳಗಾವಿ", lat: 15.8497, lng: 74.4977, district: "Belagavi" },
      { name: "Kalaburagi", name_local: "ಕಲಬುರಗಿ", lat: 17.3297, lng: 76.8343, district: "Kalaburagi" },
      { name: "Shivamogga", name_local: "ಶಿವಮೊಗ್ಗ", lat: 13.9299, lng: 75.5681, district: "Shivamogga" },
    ]
  },
  {
    state: "Tamil Nadu",
    state_local: "தமிழ்நாடு",
    cities: [
      { name: "Chennai", name_local: "சென்னை", lat: 13.0827, lng: 80.2707, district: "Chennai" },
      { name: "Coimbatore", name_local: "கோயம்புத்தூர்", lat: 11.0168, lng: 76.9558, district: "Coimbatore" },
      { name: "Madurai", name_local: "மதுரை", lat: 9.9252, lng: 78.1198, district: "Madurai" },
      { name: "Tiruchirappalli", name_local: "திருச்சிராப்பள்ளி", lat: 10.7905, lng: 78.7047, district: "Tiruchirappalli" },
      { name: "Salem", name_local: "சேலம்", lat: 11.6643, lng: 78.1460, district: "Salem" },
      { name: "Tirunelveli", name_local: "திருநெல்வேலி", lat: 8.7139, lng: 77.7567, district: "Tirunelveli" },
      { name: "Vellore", name_local: "வேலூர்", lat: 12.9165, lng: 79.1325, district: "Vellore" },
    ]
  },
  {
    state: "Telangana",
    state_local: "తెలంగాణ",
    cities: [
      { name: "Hyderabad", name_local: "హైదరాబాద్", lat: 17.3850, lng: 78.4867, district: "Hyderabad" },
      { name: "Warangal", name_local: "వరంగల్", lat: 17.9689, lng: 79.5941, district: "Warangal" },
      { name: "Nizamabad", name_local: "నిజామాబాద్", lat: 18.6725, lng: 78.0941, district: "Nizamabad" },
      { name: "Karimnagar", name_local: "కరీంనగర్", lat: 18.4386, lng: 79.1288, district: "Karimnagar" },
      { name: "Khammam", name_local: "ఖమ్మం", lat: 17.2473, lng: 80.1514, district: "Khammam" },
    ]
  },
  {
    state: "Gujarat",
    state_local: "ગુજરાત",
    cities: [
      { name: "Ahmedabad", name_local: "અમદાવાદ", lat: 23.0225, lng: 72.5714, district: "Ahmedabad" },
      { name: "Surat", name_local: "સુરત", lat: 21.1702, lng: 72.8311, district: "Surat" },
      { name: "Vadodara", name_local: "વડોદરા", lat: 22.3072, lng: 73.1812, district: "Vadodara" },
      { name: "Rajkot", name_local: "રાજકોટ", lat: 22.3039, lng: 70.8022, district: "Rajkot" },
      { name: "Bhavnagar", name_local: "ભાવનગર", lat: 21.7645, lng: 72.1519, district: "Bhavnagar" },
      { name: "Gandhinagar", name_local: "ગાંધીનગર", lat: 23.2156, lng: 72.6369, district: "Gandhinagar" },
    ]
  },
  {
    state: "West Bengal",
    state_local: "পশ্চিমবঙ্গ",
    cities: [
      { name: "Kolkata", name_local: "কলকাতা", lat: 22.5726, lng: 88.3639, district: "Kolkata" },
      { name: "Howrah", name_local: "হাওড়া", lat: 22.5958, lng: 88.2636, district: "Howrah" },
      { name: "Durgapur", name_local: "দুর্গাপুর", lat: 23.5204, lng: 87.3119, district: "Paschim Bardhaman" },
      { name: "Asansol", name_local: "আসানসোল", lat: 23.6739, lng: 86.9524, district: "Paschim Bardhaman" },
      { name: "Siliguri", name_local: "শিলিগুড়ি", lat: 26.7271, lng: 88.3953, district: "Darjeeling" },
    ]
  },
  {
    state: "Rajasthan",
    state_local: "राजस्थान",
    cities: [
      { name: "Jaipur", name_local: "जयपुर", lat: 26.9124, lng: 75.7873, district: "Jaipur" },
      { name: "Jodhpur", name_local: "जोधपुर", lat: 26.2389, lng: 73.0243, district: "Jodhpur" },
      { name: "Udaipur", name_local: "उदयपुर", lat: 24.5854, lng: 73.7125, district: "Udaipur" },
      { name: "Kota", name_local: "कोटा", lat: 25.2138, lng: 75.8648, district: "Kota" },
      { name: "Bikaner", name_local: "बीकानेर", lat: 28.0229, lng: 73.3119, district: "Bikaner" },
      { name: "Ajmer", name_local: "अजमेर", lat: 26.4499, lng: 74.6399, district: "Ajmer" },
    ]
  },
  {
    state: "Uttar Pradesh",
    state_local: "उत्तर प्रदेश",
    cities: [
      { name: "Lucknow", name_local: "लखनऊ", lat: 26.8467, lng: 80.9462, district: "Lucknow" },
      { name: "Kanpur", name_local: "कानपुर", lat: 26.4499, lng: 80.3319, district: "Kanpur Nagar" },
      { name: "Varanasi", name_local: "वाराणसी", lat: 25.3176, lng: 82.9739, district: "Varanasi" },
      { name: "Agra", name_local: "आगरा", lat: 27.1767, lng: 78.0081, district: "Agra" },
      { name: "Noida", name_local: "नोएडा", lat: 28.5355, lng: 77.3910, district: "Gautam Buddha Nagar" },
      { name: "Prayagraj", name_local: "प्रयागराज", lat: 25.4358, lng: 81.8463, district: "Prayagraj" },
      { name: "Meerut", name_local: "मेरठ", lat: 28.9845, lng: 77.7064, district: "Meerut" },
    ]
  },
  {
    state: "Kerala",
    state_local: "കേരളം",
    cities: [
      { name: "Thiruvananthapuram", name_local: "തിരുവനന്തപുരം", lat: 8.5241, lng: 76.9366, district: "Thiruvananthapuram" },
      { name: "Kochi", name_local: "കൊച്ചി", lat: 9.9312, lng: 76.2673, district: "Ernakulam" },
      { name: "Kozhikode", name_local: "കോഴിക്കോട്", lat: 11.2588, lng: 75.7804, district: "Kozhikode" },
      { name: "Thrissur", name_local: "തൃശ്ശൂർ", lat: 10.5276, lng: 76.2144, district: "Thrissur" },
    ]
  },
  {
    state: "Punjab",
    state_local: "ਪੰਜਾਬ",
    cities: [
      { name: "Ludhiana", name_local: "ਲੁਧਿਆਣਾ", lat: 30.9010, lng: 75.8573, district: "Ludhiana" },
      { name: "Amritsar", name_local: "ਅੰਮ੍ਰਿਤਸਰ", lat: 31.6340, lng: 74.8723, district: "Amritsar" },
      { name: "Jalandhar", name_local: "ਜਲੰਧਰ", lat: 31.3260, lng: 75.5762, district: "Jalandhar" },
      { name: "Patiala", name_local: "ਪਟਿਆਲਾ", lat: 30.3398, lng: 76.3869, district: "Patiala" },
      { name: "Chandigarh", name_local: "ਚੰਡੀਗੜ੍ਹ", lat: 30.7333, lng: 76.7794, district: "Chandigarh" },
    ]
  },
  {
    state: "Andhra Pradesh",
    state_local: "ఆంధ్రప్రదేశ్",
    cities: [
      { name: "Visakhapatnam", name_local: "విశాఖపట్నం", lat: 17.6868, lng: 83.2185, district: "Visakhapatnam" },
      { name: "Vijayawada", name_local: "విజయవాడ", lat: 16.5062, lng: 80.6480, district: "NTR" },
      { name: "Guntur", name_local: "గుంటూరు", lat: 16.3067, lng: 80.4365, district: "Guntur" },
      { name: "Tirupati", name_local: "తిరుపతి", lat: 13.6288, lng: 79.4192, district: "Tirupati" },
    ]
  },
  {
    state: "Bihar",
    state_local: "बिहार",
    cities: [
      { name: "Patna", name_local: "पटना", lat: 25.5941, lng: 85.1376, district: "Patna" },
      { name: "Gaya", name_local: "गया", lat: 24.7914, lng: 85.0002, district: "Gaya" },
      { name: "Bhagalpur", name_local: "भागलपुर", lat: 25.2425, lng: 86.9842, district: "Bhagalpur" },
      { name: "Muzaffarpur", name_local: "मुजफ्फरपुर", lat: 26.1209, lng: 85.3647, district: "Muzaffarpur" },
    ]
  },
  {
    state: "Odisha",
    state_local: "ଓଡ଼ିଶା",
    cities: [
      { name: "Bhubaneswar", name_local: "ଭୁବନେଶ୍ୱର", lat: 20.2961, lng: 85.8245, district: "Khurda" },
      { name: "Cuttack", name_local: "କଟକ", lat: 20.4625, lng: 85.8828, district: "Cuttack" },
      { name: "Rourkela", name_local: "ରାଉରକେଲା", lat: 22.2604, lng: 84.8536, district: "Sundargarh" },
      { name: "Puri", name_local: "ପୁରୀ", lat: 19.8135, lng: 85.8312, district: "Puri" },
    ]
  },
  {
    state: "Madhya Pradesh",
    state_local: "मध्य प्रदेश",
    cities: [
      { name: "Bhopal", name_local: "भोपाल", lat: 23.2599, lng: 77.4126, district: "Bhopal" },
      { name: "Indore", name_local: "इंदौर", lat: 22.7196, lng: 75.8577, district: "Indore" },
      { name: "Gwalior", name_local: "ग्वालियर", lat: 26.2183, lng: 78.1828, district: "Gwalior" },
      { name: "Jabalpur", name_local: "जबलपुर", lat: 23.1815, lng: 79.9864, district: "Jabalpur" },
      { name: "Ujjain", name_local: "उज्जैन", lat: 23.1765, lng: 75.7885, district: "Ujjain" },
    ]
  },
  {
    state: "Goa",
    state_local: "गोवा",
    cities: [
      { name: "Panaji", name_local: "पणजी", lat: 15.4909, lng: 73.8278, district: "North Goa" },
      { name: "Margao", name_local: "मडगाव", lat: 15.2832, lng: 73.9862, district: "South Goa" },
      { name: "Vasco da Gama", name_local: "वास्को दा गामा", lat: 15.3959, lng: 73.8157, district: "South Goa" },
    ]
  },
  {
    state: "Assam",
    state_local: "অসম",
    cities: [
      { name: "Guwahati", name_local: "গুৱাহাটী", lat: 26.1445, lng: 91.7362, district: "Kamrup Metropolitan" },
      { name: "Silchar", name_local: "শিলচৰ", lat: 24.8170, lng: 92.7937, district: "Cachar" },
      { name: "Dibrugarh", name_local: "ডিব্ৰুগড়", lat: 27.4728, lng: 94.9120, district: "Dibrugarh" },
    ]
  }
]

export function findCityDetails(cityName: string): CityInfo | null {
  for (const stateObj of INDIA_LOCATIONS) {
    for (const city of stateObj.cities) {
      if (city.name.toLowerCase() === cityName.toLowerCase()) {
        return city
      }
    }
  }
  return null
}
