import { Outlet } from 'react-router-dom';
import Header from '../public/Header';
import Footer from '../public/Footer';
import CartView from '../public/Cart';
import EnhancedAlert from '../public/EnhancedAlert';
import { useShopContext } from '../../store/ShopContext';

export default function RootLayout() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartItemLink,
    updateCartItemCustomData,
    updateCartItemQuantity,
    removeFromCart,
    setCart,
    getTotalPrice,
    setView,
    isLoggedIn,
    alertConfig,
    setAlertConfig,
    handleSignIn: onSignInClick,
    handleSignUp: onSignUpClick,
  } = useShopContext();

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
      <CartView
        cart={cart}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        addToCart={addToCart}
        updateCartItemLink={updateCartItemLink}
        updateCartItemCustomData={updateCartItemCustomData}
        updateCartItemQuantity={updateCartItemQuantity}
        removeFromCart={removeFromCart}
        setCart={setCart}
        getTotalPrice={getTotalPrice}
        setView={setView}
        isLoggedIn={isLoggedIn}
        onSignInClick={onSignInClick}
        onSignUpClick={onSignUpClick}
        onAlert={(type, title, message, onConfirm) =>
          setAlertConfig({ isOpen: true, type, title, message, onConfirm })
        }
      />
      <EnhancedAlert
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        onConfirm={alertConfig.onConfirm}
      />
    </>
  );
}
