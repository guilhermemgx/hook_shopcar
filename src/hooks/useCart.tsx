import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const ArrayCart = [...cart];
      const ProducExisits = ArrayCart.find(e => e.id === productId)

      const stock = await api.get(`/stock/${productId}`)

      const stockAmount = stock.data.amount;
      const currentAmount = ProducExisits ? ProducExisits.amount : 0;
      const amount = currentAmount + 1;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(ProducExisits){
        ProducExisits.amount = amount
      }else{
        const product = await api.get(`products/${productId}`)

        const newProduct = {
          ...product.data, amount:1
        }
        ArrayCart.push(newProduct)
      }

      setCart(ArrayCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(ArrayCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const ArrayItem = [...cart]
      const productIndex = ArrayItem.findIndex(e => e.id === productId)

      if(productIndex >= 0){
        ArrayItem.splice(productIndex, 1)
        setCart(ArrayItem);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(ArrayItem))

      }else{
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');

    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return;
      }

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount;

      if(amount > stockAmount){
        toast.error('Qauntidade solicitada fora de estoque');
        return;
      }

      const ArrayCart = [...cart]
      const prodEcist = ArrayCart.find(e=>e.id === productId);

      if(prodEcist){
        prodEcist.amount = amount
        setCart(ArrayCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(ArrayCart))
      }else{
        throw Error()
      }
    } catch {
      toast.error('Erro na alteracao de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
