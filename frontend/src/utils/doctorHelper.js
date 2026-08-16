/**
 * Resolves a doctor's display name dynamically and professionally.
 * Prioritizes pre-seeded Egyptian names from contactInfo, nested profiles,
 * or mapped email usernames.
 * 
 * @param {Object} doctor - The doctor profile or user object
 * @returns {string} The fully resolved name (e.g., "Dr. Ahmed Mostafa")
 */
export const getDoctorName = (doctor) => {
  if (!doctor) return 'Consultant';

  // 1. If it's a doctor profile containing contactInfo
  if (doctor.contactInfo) {
    const parts = doctor.contactInfo.split(',');
    if (parts.length > 0) {
      const namePart = parts[0].trim();
      if (namePart.startsWith('Dr.')) return namePart;
      if (namePart.length > 0) return `Dr. ${namePart}`;
    }
  }

  // 2. If it's a User object containing a doctorProfile
  if (doctor.doctorProfile?.contactInfo) {
    const parts = doctor.doctorProfile.contactInfo.split(',');
    if (parts.length > 0) {
      const namePart = parts[0].trim();
      if (namePart.startsWith('Dr.')) return namePart;
      if (namePart.length > 0) return `Dr. ${namePart}`;
    }
  }

  // 3. Fallback to email username mapping
  const email = doctor.user?.email || doctor.email || '';
  const prefix = email.split('@')[0];
  
  if (prefix === 'doctor.ahmed' || prefix === 'doctor.jenkins') return 'Dr. Ahmed Mostafa';
  if (prefix === 'doctor.mona' || prefix === 'doctor.vance') return 'Dr. Mona Hassan';
  if (prefix === 'doctor.khaled' || prefix === 'doctor.stone') return 'Dr. Khaled Ibrahim';

  // 4. Secondary fallback: capitalize email username
  if (prefix) {
    return 'Dr. ' + prefix
      .split('.')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

  return 'Dr. Consultant';
};
