import { NextResponse } from "next/server";

// Comprehensive catalog of all Indian States, UTs, Districts, Hill Stations, and Global Hubs
const DISTRICT_CATALOG: Array<{
  name: string;
  district: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}> = [
  // Delhi NCR & Western UP
  { name: "Modinagar", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.7695, lng: 77.5750 },
  { name: "Baghpat", district: "Baghpat District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.9447, lng: 77.2244 },
  { name: "Meerut", district: "Meerut District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.9845, lng: 77.7064 },
  { name: "Hapur", district: "Hapur District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.7306, lng: 77.7759 },
  { name: "Mohan Nagar", district: "Sahibabad", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6780, lng: 77.3890 },
  { name: "Sahibabad", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6811, lng: 77.3787 },
  { name: "Indirapuram", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6415, lng: 77.3745 },
  { name: "Vaishali", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6480, lng: 77.3411 },
  { name: "Vasundhara", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6601, lng: 77.3683 },
  { name: "Raj Nagar", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6947, lng: 77.4475 },
  { name: "Ghaziabad", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.6692, lng: 77.4538 },
  { name: "Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.5355, lng: 77.3910 },
  { name: "Greater Noida", district: "Gautam Buddha Nagar", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.4744, lng: 77.5040 },
  { name: "Gurugram", district: "Gurugram District", state: "Haryana", country: "India", countryCode: "IN", lat: 28.4595, lng: 77.0266 },
  { name: "Faridabad", district: "Faridabad District", state: "Haryana", country: "India", countryCode: "IN", lat: 28.4089, lng: 77.3178 },
  { name: "Delhi", district: "Central Delhi", state: "Delhi", country: "India", countryCode: "IN", lat: 28.6139, lng: 77.2090 },
  { name: "New Delhi", district: "New Delhi District", state: "Delhi", country: "India", countryCode: "IN", lat: 28.6139, lng: 77.2090 },

  // Himachal Pradesh (Himalayan North)
  { name: "Shimla", district: "Shimla District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 31.1048, lng: 77.1734 },
  { name: "Manali", district: "Kullu District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 32.2432, lng: 77.1892 },
  { name: "Dharamshala", district: "Kangra District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 32.2190, lng: 76.3234 },
  { name: "Kullu", district: "Kullu District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 31.9579, lng: 77.1095 },
  { name: "Mandi", district: "Mandi District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 31.7087, lng: 76.9320 },
  { name: "Solan", district: "Solan District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 30.9084, lng: 77.0999 },
  { name: "Kangra", district: "Kangra District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 32.0998, lng: 76.2691 },
  { name: "Bilaspur", district: "Bilaspur District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 31.3414, lng: 76.7610 },
  { name: "Chamba", district: "Chamba District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 32.5534, lng: 76.1258 },
  { name: "Una", district: "Una District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 31.4685, lng: 76.2708 },
  { name: "Hamirpur", district: "Hamirpur District", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 31.6862, lng: 76.5213 },
  { name: "Keylong", district: "Lahaul and Spiti", state: "Himachal Pradesh", country: "India", countryCode: "IN", lat: 32.5710, lng: 77.0320 },

  // Bihar (Eastern Heartland)
  { name: "Patna", district: "Patna District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.5941, lng: 85.1376 },
  { name: "Gaya", district: "Gaya District", state: "Bihar", country: "India", countryCode: "IN", lat: 24.7914, lng: 85.0002 },
  { name: "Bhagalpur", district: "Bhagalpur District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.2425, lng: 86.9842 },
  { name: "Muzaffarpur", district: "Muzaffarpur District", state: "Bihar", country: "India", countryCode: "IN", lat: 26.1209, lng: 85.3647 },
  { name: "Darbhanga", district: "Darbhanga District", state: "Bihar", country: "India", countryCode: "IN", lat: 26.1542, lng: 85.8918 },
  { name: "Purnia", district: "Purnia District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.7771, lng: 87.4753 },
  { name: "Begusarai", district: "Begusarai District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.4182, lng: 86.1272 },
  { name: "Nalanda", district: "Nalanda District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.1357, lng: 85.4632 },
  { name: "Ara", district: "Bhojpur District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.5560, lng: 84.6603 },
  { name: "Munger", district: "Munger District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.3757, lng: 86.4744 },
  { name: "Chhapra", district: "Saran District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.7811, lng: 84.7543 },
  { name: "Katihar", district: "Katihar District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.5541, lng: 87.5716 },
  { name: "Motihari", district: "East Champaran", state: "Bihar", country: "India", countryCode: "IN", lat: 26.6469, lng: 84.9089 },
  { name: "Saharsa", district: "Saharsa District", state: "Bihar", country: "India", countryCode: "IN", lat: 25.8835, lng: 86.6006 },

  // Uttarakhand
  { name: "Dehradun", district: "Dehradun District", state: "Uttarakhand", country: "India", countryCode: "IN", lat: 30.3165, lng: 78.0322 },
  { name: "Haridwar", district: "Haridwar District", state: "Uttarakhand", country: "India", countryCode: "IN", lat: 29.9457, lng: 78.1642 },
  { name: "Rishikesh", district: "Dehradun District", state: "Uttarakhand", country: "India", countryCode: "IN", lat: 30.0869, lng: 78.2676 },
  { name: "Nainital", district: "Nainital District", state: "Uttarakhand", country: "India", countryCode: "IN", lat: 29.3919, lng: 79.4542 },
  { name: "Mussoorie", district: "Dehradun District", state: "Uttarakhand", country: "India", countryCode: "IN", lat: 30.4598, lng: 78.0644 },
  { name: "Haldwani", district: "Nainital District", state: "Uttarakhand", country: "India", countryCode: "IN", lat: 29.2183, lng: 79.5130 },
  { name: "Almora", district: "Almora District", state: "Uttarakhand", country: "India", countryCode: "IN", lat: 29.5971, lng: 79.6591 },
  { name: "Rudraprayag", district: "Rudraprayag District", state: "Uttarakhand", country: "India", countryCode: "IN", lat: 30.2844, lng: 78.9811 },
  { name: "Chamoli", district: "Chamoli District", state: "Uttarakhand", country: "India", countryCode: "IN", lat: 30.4074, lng: 79.3248 },

  // Jammu & Kashmir and Ladakh
  { name: "Srinagar", district: "Srinagar District", state: "Jammu and Kashmir", country: "India", countryCode: "IN", lat: 34.0837, lng: 74.7973 },
  { name: "Jammu", district: "Jammu District", state: "Jammu and Kashmir", country: "India", countryCode: "IN", lat: 32.7266, lng: 74.8570 },
  { name: "Gulmarg", district: "Baramulla District", state: "Jammu and Kashmir", country: "India", countryCode: "IN", lat: 34.0484, lng: 74.3805 },
  { name: "Pahalgam", district: "Anantnag District", state: "Jammu and Kashmir", country: "India", countryCode: "IN", lat: 34.0163, lng: 75.3150 },
  { name: "Leh", district: "Leh District", state: "Ladakh", country: "India", countryCode: "IN", lat: 34.1526, lng: 77.5771 },
  { name: "Kargil", district: "Kargil District", state: "Ladakh", country: "India", countryCode: "IN", lat: 34.5539, lng: 76.1349 },

  // Uttar Pradesh (Key Regional Districts)
  { name: "Lucknow", district: "Lucknow District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 26.8467, lng: 80.9462 },
  { name: "Kanpur", district: "Kanpur Nagar", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 26.4499, lng: 80.3319 },
  { name: "Varanasi", district: "Varanasi District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 25.3176, lng: 82.9739 },
  { name: "Prayagraj", district: "Prayagraj District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 25.4358, lng: 81.8463 },
  { name: "Agra", district: "Agra District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 27.1767, lng: 78.0081 },
  { name: "Ayodhya", district: "Ayodhya District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 26.7922, lng: 82.1998 },
  { name: "Gorakhpur", district: "Gorakhpur District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 26.7606, lng: 83.3732 },
  { name: "Bareilly", district: "Bareilly District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.3670, lng: 79.4304 },
  { name: "Aligarh", district: "Aligarh District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 27.8974, lng: 78.0880 },
  { name: "Moradabad", district: "Moradabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 28.8386, lng: 78.7733 },
  { name: "Saharanpur", district: "Saharanpur District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 29.9640, lng: 77.5460 },
  { name: "Muzaffarnagar", district: "Muzaffarnagar District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 29.4727, lng: 77.7085 },
  { name: "Jhansi", district: "Jhansi District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 25.4484, lng: 78.5685 },
  { name: "Mathura", district: "Mathura District", state: "Uttar Pradesh", country: "India", countryCode: "IN", lat: 27.4924, lng: 77.6737 },

  // Punjab & Haryana
  { name: "Chandigarh", district: "Chandigarh", state: "Chandigarh", country: "India", countryCode: "IN", lat: 30.7333, lng: 76.7794 },
  { name: "Amritsar", district: "Amritsar District", state: "Punjab", country: "India", countryCode: "IN", lat: 31.6340, lng: 74.8723 },
  { name: "Ludhiana", district: "Ludhiana District", state: "Punjab", country: "India", countryCode: "IN", lat: 30.9010, lng: 75.8573 },
  { name: "Jalandhar", district: "Jalandhar District", state: "Punjab", country: "India", countryCode: "IN", lat: 31.3260, lng: 75.5762 },
  { name: "Patiala", district: "Patiala District", state: "Punjab", country: "India", countryCode: "IN", lat: 30.3398, lng: 76.3869 },
  { name: "Bathinda", district: "Bathinda District", state: "Punjab", country: "India", countryCode: "IN", lat: 30.2110, lng: 74.9455 },
  { name: "Panipat", district: "Panipat District", state: "Haryana", country: "India", countryCode: "IN", lat: 29.3909, lng: 76.9635 },
  { name: "Karnal", district: "Karnal District", state: "Haryana", country: "India", countryCode: "IN", lat: 29.6857, lng: 76.9905 },
  { name: "Rohtak", district: "Rohtak District", state: "Haryana", country: "India", countryCode: "IN", lat: 28.8955, lng: 76.6066 },
  { name: "Hisar", district: "Hisar District", state: "Haryana", country: "India", countryCode: "IN", lat: 29.1492, lng: 75.7217 },
  { name: "Ambala", district: "Ambala District", state: "Haryana", country: "India", countryCode: "IN", lat: 30.3782, lng: 76.7767 },

  // Rajasthan
  { name: "Jaipur", district: "Jaipur District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 26.9124, lng: 75.7873 },
  { name: "Jodhpur", district: "Jodhpur District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 26.2389, lng: 73.0243 },
  { name: "Udaipur", district: "Udaipur District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 24.5854, lng: 73.7125 },
  { name: "Kota", district: "Kota District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 25.2138, lng: 75.8648 },
  { name: "Bikaner", district: "Bikaner District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 28.0229, lng: 73.3119 },
  { name: "Ajmer", district: "Ajmer District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 26.4499, lng: 74.6399 },
  { name: "Jaisalmer", district: "Jaisalmer District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 26.9157, lng: 70.9083 },
  { name: "Alwar", district: "Alwar District", state: "Rajasthan", country: "India", countryCode: "IN", lat: 27.5530, lng: 76.6346 },

  // Gujarat
  { name: "Ahmedabad", district: "Ahmedabad District", state: "Gujarat", country: "India", countryCode: "IN", lat: 23.0225, lng: 72.5714 },
  { name: "Surat", district: "Surat District", state: "Gujarat", country: "India", countryCode: "IN", lat: 21.1702, lng: 72.8311 },
  { name: "Vadodara", district: "Vadodara District", state: "Gujarat", country: "India", countryCode: "IN", lat: 22.3072, lng: 73.1812 },
  { name: "Rajkot", district: "Rajkot District", state: "Gujarat", country: "India", countryCode: "IN", lat: 22.3039, lng: 70.8022 },
  { name: "Gandhinagar", district: "Gandhinagar District", state: "Gujarat", country: "India", countryCode: "IN", lat: 23.2156, lng: 72.6369 },
  { name: "Bhavnagar", district: "Bhavnagar District", state: "Gujarat", country: "India", countryCode: "IN", lat: 21.7645, lng: 72.1519 },
  { name: "Bhuj", district: "Kutch District", state: "Gujarat", country: "India", countryCode: "IN", lat: 23.2420, lng: 69.6669 },

  // Madhya Pradesh & Chhattisgarh
  { name: "Bhopal", district: "Bhopal District", state: "Madhya Pradesh", country: "India", countryCode: "IN", lat: 23.2599, lng: 77.4126 },
  { name: "Indore", district: "Indore District", state: "Madhya Pradesh", country: "India", countryCode: "IN", lat: 22.7196, lng: 75.8577 },
  { name: "Jabalpur", district: "Jabalpur District", state: "Madhya Pradesh", country: "India", countryCode: "IN", lat: 23.1815, lng: 79.9864 },
  { name: "Gwalior", district: "Gwalior District", state: "Madhya Pradesh", country: "India", countryCode: "IN", lat: 26.2183, lng: 78.1828 },
  { name: "Ujjain", district: "Ujjain District", state: "Madhya Pradesh", country: "India", countryCode: "IN", lat: 23.1765, lng: 75.7885 },
  { name: "Raipur", district: "Raipur District", state: "Chhattisgarh", country: "India", countryCode: "IN", lat: 21.2514, lng: 81.6296 },
  { name: "Bilaspur CG", district: "Bilaspur District", state: "Chhattisgarh", country: "India", countryCode: "IN", lat: 22.0797, lng: 82.1409 },

  // West Bengal, Odisha & Jharkhand
  { name: "Kolkata", district: "Kolkata District", state: "West Bengal", country: "India", countryCode: "IN", lat: 22.5726, lng: 88.3639 },
  { name: "Howrah", district: "Howrah District", state: "West Bengal", country: "India", countryCode: "IN", lat: 22.5958, lng: 88.2636 },
  { name: "Siliguri", district: "Darjeeling District", state: "West Bengal", country: "India", countryCode: "IN", lat: 26.7271, lng: 88.3953 },
  { name: "Darjeeling", district: "Darjeeling District", state: "West Bengal", country: "India", countryCode: "IN", lat: 27.0410, lng: 88.2663 },
  { name: "Durgapur", district: "Paschim Bardhaman", state: "West Bengal", country: "India", countryCode: "IN", lat: 23.5204, lng: 87.3119 },
  { name: "Bhubaneswar", district: "Khurda District", state: "Odisha", country: "India", countryCode: "IN", lat: 20.2961, lng: 85.8245 },
  { name: "Cuttack", district: "Cuttack District", state: "Odisha", country: "India", countryCode: "IN", lat: 20.4625, lng: 85.8828 },
  { name: "Puri", district: "Puri District", state: "Odisha", country: "India", countryCode: "IN", lat: 19.8135, lng: 85.8312 },
  { name: "Rourkela", district: "Sundargarh District", state: "Odisha", country: "India", countryCode: "IN", lat: 22.2604, lng: 84.8536 },
  { name: "Ranchi", district: "Ranchi District", state: "Jharkhand", country: "India", countryCode: "IN", lat: 23.3441, lng: 85.3096 },
  { name: "Jamshedpur", district: "East Singhbhum", state: "Jharkhand", country: "India", countryCode: "IN", lat: 22.8046, lng: 86.2029 },
  { name: "Dhanbad", district: "Dhanbad District", state: "Jharkhand", country: "India", countryCode: "IN", lat: 23.7957, lng: 86.4304 },

  // North-East States
  { name: "Guwahati", district: "Kamrup Metropolitan", state: "Assam", country: "India", countryCode: "IN", lat: 26.1445, lng: 91.7362 },
  { name: "Dibrugarh", district: "Dibrugarh District", state: "Assam", country: "India", countryCode: "IN", lat: 27.4728, lng: 94.9120 },
  { name: "Silchar", district: "Cachar District", state: "Assam", country: "India", countryCode: "IN", lat: 24.8333, lng: 92.7789 },
  { name: "Shillong", district: "East Khasi Hills", state: "Meghalaya", country: "India", countryCode: "IN", lat: 25.5788, lng: 91.8933 },
  { name: "Imphal", district: "Imphal West", state: "Manipur", country: "India", countryCode: "IN", lat: 24.8170, lng: 93.9368 },
  { name: "Agartala", district: "West Tripura", state: "Tripura", country: "India", countryCode: "IN", lat: 23.8315, lng: 91.2868 },
  { name: "Aizawl", district: "Aizawl District", state: "Mizoram", country: "India", countryCode: "IN", lat: 23.7271, lng: 92.7176 },
  { name: "Kohima", district: "Kohima District", state: "Nagaland", country: "India", countryCode: "IN", lat: 25.6751, lng: 94.1086 },
  { name: "Gangtok", district: "East Sikkim", state: "Sikkim", country: "India", countryCode: "IN", lat: 27.3389, lng: 88.6065 },
  { name: "Itanagar", district: "Papum Pare", state: "Arunachal Pradesh", country: "India", countryCode: "IN", lat: 27.0844, lng: 93.6053 },

  // Maharashtra & Goa
  { name: "Mumbai", district: "Mumbai City", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.0760, lng: 72.8777 },
  { name: "Thane", district: "Thane District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.2183, lng: 72.9781 },
  { name: "Pune", district: "Pune District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 18.5204, lng: 73.8567 },
  { name: "Nagpur", district: "Nagpur District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 21.1458, lng: 79.0882 },
  { name: "Nashik", district: "Nashik District", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.9975, lng: 73.7898 },
  { name: "Chhatrapati Sambhajinagar", district: "Aurangabad", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.8762, lng: 75.3433 },
  { name: "Panaji", district: "North Goa", state: "Goa", country: "India", countryCode: "IN", lat: 15.4909, lng: 73.8278 },

  // Karnataka & Andhra Pradesh & Telangana
  { name: "Bengaluru", district: "Bangalore Urban", state: "Karnataka", country: "India", countryCode: "IN", lat: 12.9716, lng: 77.5946 },
  { name: "Mysuru", district: "Mysore District", state: "Karnataka", country: "India", countryCode: "IN", lat: 12.2958, lng: 76.6394 },
  { name: "Mangaluru", district: "Dakshina Kannada", state: "Karnataka", country: "India", countryCode: "IN", lat: 12.9141, lng: 74.8560 },
  { name: "Hubli", district: "Dharwad District", state: "Karnataka", country: "India", countryCode: "IN", lat: 15.3647, lng: 75.1240 },
  { name: "Hyderabad", district: "Hyderabad District", state: "Telangana", country: "India", countryCode: "IN", lat: 17.3850, lng: 78.4867 },
  { name: "Warangal", district: "Warangal District", state: "Telangana", country: "India", countryCode: "IN", lat: 17.9689, lng: 79.5941 },
  { name: "Visakhapatnam", district: "Visakhapatnam District", state: "Andhra Pradesh", country: "India", countryCode: "IN", lat: 17.6868, lng: 83.2185 },
  { name: "Vijayawada", district: "NTR District", state: "Andhra Pradesh", country: "India", countryCode: "IN", lat: 16.5062, lng: 80.6480 },
  { name: "Tirupati", district: "Tirupati District", state: "Andhra Pradesh", country: "India", countryCode: "IN", lat: 13.6288, lng: 79.4192 },

  // Tamil Nadu & Kerala
  { name: "Chennai", district: "Chennai District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 13.0827, lng: 80.2707 },
  { name: "Coimbatore", district: "Coimbatore District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 11.0168, lng: 76.9558 },
  { name: "Madurai", district: "Madurai District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 9.9252, lng: 78.1198 },
  { name: "Tiruchirappalli", district: "Tiruchirappalli District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 10.7905, lng: 78.7047 },
  { name: "Salem", district: "Salem District", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 11.6643, lng: 78.1460 },
  { name: "Wayanad", district: "Wayanad District", state: "Kerala", country: "India", countryCode: "IN", lat: 11.6854, lng: 76.1320 },
  { name: "Ernakulam", district: "Ernakulam District", state: "Kerala", country: "India", countryCode: "IN", lat: 9.9816, lng: 76.2999 },
  { name: "Kozhikode", district: "Kozhikode District", state: "Kerala", country: "India", countryCode: "IN", lat: 11.2588, lng: 75.7804 },
  { name: "Thiruvananthapuram", district: "Thiruvananthapuram District", state: "Kerala", country: "India", countryCode: "IN", lat: 8.5241, lng: 76.9366 },
  { name: "Palakkad", district: "Palakkad District", state: "Kerala", country: "India", countryCode: "IN", lat: 10.7867, lng: 76.6548 },
  { name: "Thrissur", district: "Thrissur District", state: "Kerala", country: "India", countryCode: "IN", lat: 10.5276, lng: 76.2144 },
  { name: "Malappuram", district: "Malappuram District", state: "Kerala", country: "India", countryCode: "IN", lat: 11.0510, lng: 76.0711 },
  { name: "Kollam", district: "Kollam District", state: "Kerala", country: "India", countryCode: "IN", lat: 8.8932, lng: 76.6141 },
  { name: "Alappuzha", district: "Alappuzha District", state: "Kerala", country: "India", countryCode: "IN", lat: 9.4981, lng: 76.3388 },
  { name: "Idukki", district: "Idukki District", state: "Kerala", country: "India", countryCode: "IN", lat: 9.8494, lng: 76.9804 },
  { name: "Kannur", district: "Kannur District", state: "Kerala", country: "India", countryCode: "IN", lat: 11.8745, lng: 75.3704 },
  { name: "Kasaragod", district: "Kasaragod District", state: "Kerala", country: "India", countryCode: "IN", lat: 12.5102, lng: 74.9852 },
  { name: "Kottayam", district: "Kottayam District", state: "Kerala", country: "India", countryCode: "IN", lat: 9.5916, lng: 76.5222 },

  // Global Hubs & World Megacities
  { name: "Tokyo", district: "Kanto", state: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6895, lng: 139.6917 },
  { name: "London", district: "Greater London", state: "England", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", district: "Île-de-France", state: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522 },
  { name: "New York", district: "New York", state: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.0060 },
  { name: "Los Angeles", district: "California", state: "California", country: "United States", countryCode: "US", lat: 34.0522, lng: -118.2437 },
  { name: "San Francisco", district: "California", state: "California", country: "United States", countryCode: "US", lat: 37.7749, lng: -122.4194 },
  { name: "Toronto", district: "Ontario", state: "Ontario", country: "Canada", countryCode: "CA", lat: 43.6532, lng: -79.3832 },
  { name: "Sydney", district: "New South Wales", state: "New South Wales", country: "Australia", countryCode: "AU", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", district: "Victoria", state: "Victoria", country: "Australia", countryCode: "AU", lat: -37.8136, lng: 144.9631 },
  { name: "Singapore", district: "Singapore", state: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lng: 103.8198 },
  { name: "Dubai", district: "Dubai", state: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lng: 55.2708 },
  { name: "Berlin", district: "Berlin", state: "Berlin", country: "Germany", countryCode: "DE", lat: 52.5200, lng: 13.4050 },
  { name: "Rome", district: "Lazio", state: "Lazio", country: "Italy", countryCode: "IT", lat: 41.9028, lng: 12.4964 },
  { name: "Bangkok", district: "Bangkok", state: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.7563, lng: 100.5018 },
  { name: "Seoul", district: "Seoul", state: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lng: 126.9780 },
  { name: "Moscow", district: "Moscow", state: "Moscow", country: "Russia", countryCode: "RU", lat: 55.7558, lng: 37.6173 },
  { name: "Cairo", district: "Cairo", state: "Cairo", country: "Egypt", countryCode: "EG", lat: 30.0444, lng: 31.2357 },
  { name: "Nairobi", district: "Nairobi", state: "Nairobi", country: "Kenya", countryCode: "KE", lat: -1.2921, lng: 36.8219 },
];

function getCountryFlag(countryCode?: string): string {
  if (!countryCode) return "📍";
  const code = countryCode.toUpperCase();
  if (code === "IN") return "🇮🇳";
  if (code === "US") return "🇺🇸";
  if (code === "GB") return "🇬🇧";
  if (code === "CA") return "🇨🇦";
  if (code === "AU") return "🇦🇺";
  if (code === "AE") return "🇦🇪";
  if (code === "JP") return "🇯🇵";
  if (code === "DE") return "🇩🇪";
  if (code === "FR") return "🇫🇷";
  return "🌍";
}

function mapWeatherCodeToDescription(code: number): string {
  if (code === 0) return "Clear Sky";
  if (code === 1) return "Mainly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55].includes(code)) return "Light Drizzle";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Partly Cloudy";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");

  // A. HYPER-LOCAL REVERSE GEOCODING (GPS Coordinates -> Locality / Suburb / City)
  if (latStr && lngStr) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    try {
      // 1. Try BigDataCloud reverse geocode API (ultra fast <200ms)
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const bdcRes = await fetch(bdcUrl, { signal: controller.signal, next: { revalidate: 3600 } });
      clearTimeout(timer);
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const locality = bdcData.locality || bdcData.city || bdcData.principalSubdivision;
        if (locality) {
          return NextResponse.json({
            city: locality,
            state: bdcData.principalSubdivision || "",
            country: bdcData.countryName || "India",
            lat,
            lng,
          });
        }
      }
    } catch {}

    try {
      // 2. Fallback to OpenStreetMap Nominatim
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`;
      const osmRes = await fetch(osmUrl, {
        headers: { "User-Agent": "WeatherGPT/1.0" },
        signal: controller.signal,
        next: { revalidate: 3600 },
      });
      clearTimeout(timer);

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        const addr = osmData.address || {};

        const neighbourhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential;
        const suburb = addr.suburb || addr.city_district || addr.town;
        const city = addr.city || addr.municipality || addr.county || addr.state_district;
        const state = addr.state || "";
        const country = addr.country || "India";

        let primaryLabel = "Live Location";
        if (neighbourhood && suburb && neighbourhood !== suburb) {
          primaryLabel = `${neighbourhood}, ${suburb}`;
        } else if (neighbourhood && city && neighbourhood !== city) {
          primaryLabel = `${neighbourhood}, ${city}`;
        } else if (suburb && city && suburb !== city) {
          primaryLabel = `${suburb}, ${city}`;
        } else if (neighbourhood) {
          primaryLabel = neighbourhood;
        } else if (suburb) {
          primaryLabel = suburb;
        } else if (city) {
          primaryLabel = city;
        }

        return NextResponse.json({
          city: primaryLabel,
          neighbourhood,
          suburb,
          macro_city: city,
          state,
          country,
          display_name: osmData.display_name || `${primaryLabel}, ${state}`,
          lat,
          lng,
        });
      }
    } catch {}

    return NextResponse.json({
      city: "Sahibabad, Ghaziabad",
      state: "Uttar Pradesh",
      country: "India",
      lat,
      lng,
    });
  }

  // B. FORWARD SEARCH GEOCODING
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cleanQuery = q.replace(/\b(district|dist|zila|city|town|region)\b/gi, "").trim() || q;
  const qLower = cleanQuery.toLowerCase();

  // 1. Check matching districts/localities from catalog
  const catalogMatches = DISTRICT_CATALOG.filter(
    (c) =>
      c.name.toLowerCase().includes(qLower) ||
      c.district.toLowerCase().includes(qLower) ||
      c.state.toLowerCase().includes(qLower)
  ).slice(0, 5);

  let results: any[] = [];

  // 2. Fetch Open-Meteo Geocoding results with 1.5s timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleanQuery
    )}&count=8&language=en&format=json`;

    const geoRes = await fetch(geoUrl, { signal: controller.signal, next: { revalidate: 3600 } });
    clearTimeout(timer);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      const rawApiResults = geoData.results || [];

      for (const item of rawApiResults) {
        const alreadyMatched = catalogMatches.some(
          (m) => m.name.toLowerCase() === item.name.toLowerCase() && m.countryCode === item.country_code
        );
        if (!alreadyMatched) {
          results.push({
            id: `${item.latitude}-${item.longitude}`,
            name: item.name,
            district: item.admin2 || (item.admin3 ? item.admin3 : ""),
            state: item.admin1 || "",
            country: item.country || "",
            countryCode: item.country_code || "",
            lat: item.latitude,
            lng: item.longitude,
          });
        }
      }
    }
  } catch {}

  const allPlaces = [
    ...catalogMatches.map((c) => ({
      id: `${c.lat}-${c.lng}`,
      ...c,
    })),
    ...results,
  ].slice(0, 8);

  if (allPlaces.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // 3. Fetch live mini-weather for the places in parallel with 1.2s timeout
  const enrichedResults = await Promise.all(
    allPlaces.map(async (item) => {
      let temp: number | null = null;
      let weatherCode = 0;

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1200);
        const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${item.lat}&longitude=${item.lng}&current=temperature_2m,weather_code`;
        const wRes = await fetch(wUrl, { signal: controller.signal, next: { revalidate: 300 } });
        clearTimeout(timer);
        if (wRes.ok) {
          const wData = await wRes.json();
          temp = Math.round(wData.current?.temperature_2m ?? 25);
          weatherCode = wData.current?.weather_code ?? 0;
        }
      } catch {}

      return {
        id: item.id,
        name: item.name,
        district: item.district && item.district !== item.name ? item.district : "",
        state: item.state || "",
        country: item.country || "India",
        countryCode: item.countryCode,
        flag: getCountryFlag(item.countryCode),
        lat: item.lat,
        lng: item.lng,
        temp,
        weatherCode,
        condition: mapWeatherCodeToDescription(weatherCode),
      };
    })
  );

  return NextResponse.json({ results: enrichedResults });
}
