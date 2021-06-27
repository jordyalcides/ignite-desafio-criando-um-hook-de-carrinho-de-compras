import { AxiosResponse } from 'axios'
import { createContext, ReactNode, useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    return storagedCart ? JSON.parse(storagedCart) : []
  })

  const addProduct = async (productId: number) => {
    try {
      const { data: stock } = await api.get<Stock>(`stock/${productId}`)
      const { data: product } = await api.get<Product>(`products/${productId}`)

      const newProduct = { ...product, amount: 1 }
      const newCart = cart.filter(product => {
        if (product.id === productId) {
          newProduct.amount = product.amount + 1
          return false
        }
        return true
      })
      newCart.push(newProduct)

      if (stock.amount < newProduct.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      let removedProduct
      const newCart = cart.filter(product => {
        if (product.id === productId) {
          removedProduct = product
          return false
        }
        return true
      })

      if (!removedProduct) throw Error()

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const { data: stock } = await api.get<Stock>(`stock/${productId}`)
      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      let updatedProduct
      const newCart = cart.filter(product => {
        if (product.id === productId) {
          updatedProduct = { ...product, amount }
          return false
        }
        return true
      })

      if (!updatedProduct) throw Error()

      newCart.push(updatedProduct)
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
