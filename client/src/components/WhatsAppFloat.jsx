export default function WhatsAppFloat() {
  const handleClick = () => {
    const msg = encodeURIComponent("Namaste! I'd like to place an order / inquire about Namdev Chiwada products.");
    window.open(`https://wa.me/919975333427?text=${msg}`, '_blank');
  };
  return (
    <button
      onClick={handleClick}
      title="Chat on WhatsApp"
      className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center text-2xl text-white transition-transform duration-200 hover:scale-110 animate-pulse2"
      style={{ background: '#25D366', boxShadow: '0 4px 20px rgba(37,211,102,0.4)' }}
    >
      💬
    </button>
  );
}
