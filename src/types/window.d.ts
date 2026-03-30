export {};

declare global {
  interface Window {
    // store
    showScreen: (name: string) => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    removeItem: (idx: number) => void;
    showProduct: (id: string) => void;
    goBack: () => void;
    goSlide: (i: number) => void;
    prevSlide: () => void;
    nextSlide: () => void;
    selectOption: (type: 'size' | 'color', val: string) => void;
    changeQty: (delta: number) => void;
    addToCart: () => void;
    goCheckout: () => void;
    openAddrSearch: () => void;
    requestPayment: () => void;
    goToShop: () => void;
    goToOrderLookup: () => void;
    copyVirtualAccount: (btn: HTMLButtonElement) => void;
    copyOrderId: (btn: HTMLButtonElement) => void;
    lookupOrder: () => void;
    // admin
    show: (name: string) => void;
    login: () => void;
    logout: () => void;
    saveBrandSettings: () => void;
    loadList: () => void;
    loadOrders: () => void;
    updateOrderStatus: (id: string, status: string) => void;
    openEditor: (id: string | null) => void;
    saveProduct: () => void;
    removeExistingImage: (i: number) => void;
    toggleHidden: (id: string, current: boolean) => void;
    deleteProduct: (id: string, name: string) => void;
    copyStoreLink: () => void;
    copyLink: (id: string) => void;
    claimProducts: () => void;
  }
}
