import type {RSA} from "otb-toolkit/src/types";

class LStorageConstructor {
  key: string

  constructor(key: any) {
    this.key = key
  }

  setter(data: RSA | RSA[] | string | number) {
    if (data) localStorage.setItem(this.key, JSON.stringify(data))
  }

  getter() {
    if (localStorage.getItem(this.key)) {
      return JSON.parse(localStorage.getItem(this.key) as string)
    }
  }

  remove() {
    return localStorage.removeItem(this.key)
  }
}

export const LStorage = {
  data: new LStorageConstructor("data"),
  productData: new LStorageConstructor("productData"),
  orderData: new LStorageConstructor("orderData"),
  new: (key: string) => new LStorageConstructor(key)
}
