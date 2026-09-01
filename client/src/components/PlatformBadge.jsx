const LABELS = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  manual: 'Manuale',
  other: 'Altro',
};

export default function PlatformBadge({ platform }) {
  return <span className={`badge badge-${platform}`}>{LABELS[platform] || platform}</span>;
}
