export const translations = {
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    
    // Home
    greeting: 'Sawubona',
    ready_journey: 'Ready for your journey?',
    your_location: 'Your Location',
    nearest_hub: 'Nearest Hub',
    nearest_stop: 'Nearest Stop',
    
    // Auth
    welcome_back: 'Welcome Back',
    create_account: 'Create Account',
    email_address: 'Email Address',
    password: 'Password',
    full_name: 'Full Name',
    sign_in: 'Sign In',
    sign_up: 'Sign Up',
    preferred_transport: 'Preferred Transport',
    preferred_language: 'Preferred Language',
    
    // Waiting
    mark_waiting: 'Mark as Waiting',
    stop_waiting: 'Stop Waiting',
    waiting_for: 'Waiting for',
    no_route_available: 'No Route Available',
    too_far: 'You must be within 1km of the stop to mark as waiting',
    
    // Posts
    share_experience: 'Share your transport experience...',
    select_location: 'Select Location',
    transport_hubs: 'Transport Hubs',
    stops: 'Stops',
    
    // Profile
    fire_received: 'Fire Received',
    points: 'Points',
    level: 'Level',
    
    // Security
    change_password: 'Change Password',
    delete_account: 'Delete Account',
    password_reset_sent: 'Password reset email sent!',
    account_deleted: 'Your account has been successfully deleted.',
  },
  zu: {
    // Common
    loading: 'Kuyalayishwa...',
    error: 'Iphutha',
    success: 'Impumelelo',
    cancel: 'Khansela',
    save: 'Londoloza',
    delete: 'Susa',
    
    // Home
    greeting: 'Sawubona',
    ready_journey: 'Ukulungele uhambo lwakho?',
    your_location: 'Indawo Yakho',
    nearest_hub: 'I-Hub Eseduze',
    nearest_stop: 'Isiteshi Esiseduze',
    
    // Auth
    welcome_back: 'Siyakwamukela Futhi',
    create_account: 'Dala I-akhawunti',
    email_address: 'I-imeyli',
    password: 'Iphasiwedi',
    full_name: 'Igama Eliphelele',
    sign_in: 'Ngena',
    sign_up: 'Bhalisa',
    preferred_transport: 'Ezokuthutha Ozikhethayo',
    preferred_language: 'Ulimi Olikhethayo',
    
    // Waiting
    mark_waiting: 'Maka Njengolindile',
    stop_waiting: 'Yeka Ukulinda',
    waiting_for: 'Ulindele',
    no_route_available: 'Ayikho Indlela',
    too_far: 'Kufanele ube eduze nesiteshi (1km) ukuze umake njengolindile',
    
    // Posts
    share_experience: 'Yabelana ngolwazi lwakho lwezokuthutha...',
    select_location: 'Khetha Indawo',
    transport_hubs: 'Ama-Hub Ezokuthutha',
    stops: 'Iziteshi',
    
    // Profile
    fire_received: 'Umlilo Otholiwe',
    points: 'Amaphuzu',
    level: 'Izinga',
    
    // Security
    change_password: 'Shintsha Iphasiwedi',
    delete_account: 'Susa I-akhawunti',
    password_reset_sent: 'I-imeyli yokubuyisela iphasiwedi ithunyelwe!',
    account_deleted: 'I-akhawunti yakho isusiwe ngempumelelo.',
  },
  af: {
    // Common
    loading: 'Laai...',
    error: 'Fout',
    success: 'Sukses',
    cancel: 'Kanselleer',
    save: 'Stoor',
    delete: 'Verwyder',
    
    // Home
    greeting: 'Hallo',
    ready_journey: 'Gereed vir jou reis?',
    your_location: 'Jou Ligging',
    nearest_hub: 'Naaste Hub',
    nearest_stop: 'Naaste Stop',
    
    // Auth
    welcome_back: 'Welkom Terug',
    create_account: 'Skep Rekening',
    email_address: 'E-pos Adres',
    password: 'Wagwoord',
    full_name: 'Volle Naam',
    sign_in: 'Teken In',
    sign_up: 'Registreer',
    preferred_transport: 'Voorkeur Vervoer',
    preferred_language: 'Voorkeur Taal',
    
    // Waiting
    mark_waiting: 'Merk as Wag',
    stop_waiting: 'Stop Wag',
    waiting_for: 'Wag vir',
    no_route_available: 'Geen Roete Beskikbaar',
    too_far: 'Jy moet binne 1km van die stop wees om as wag te merk',
    
    // Posts
    share_experience: 'Deel jou vervoer ervaring...',
    select_location: 'Kies Ligging',
    transport_hubs: 'Vervoer Hubs',
    stops: 'Stops',
    
    // Profile
    fire_received: 'Vuur Ontvang',
    points: 'Punte',
    level: 'Vlak',
    
    // Security
    change_password: 'Verander Wagwoord',
    delete_account: 'Verwyder Rekening',
    password_reset_sent: 'Wagwoord herstel e-pos gestuur!',
    account_deleted: 'Jou rekening is suksesvol verwyder.',
  }
};

export function getTranslation(language: string, key: string): string {
  const lang = language?.toLowerCase() || 'en';
  const langCode = lang === 'english' ? 'en' : 
                   lang === 'zulu' ? 'zu' : 
                   lang === 'afrikaans' ? 'af' : 'en';
  
  return translations[langCode as keyof typeof translations]?.[key as keyof typeof translations['en']] || 
         translations.en[key as keyof typeof translations['en']] || 
         key;
}