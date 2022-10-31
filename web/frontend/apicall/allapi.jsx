import { getSessionToken } from "@shopify/app-bridge-utils";
import axios from "axios";
// ---------------- ADD DEFAULT CONTENT -----------------
export const Update_products_price = async (app, info) => {
    try {
      const token = await getSessionToken(app);
      console.log("info : ",info)
      console.log("Update_products_price ....");
      const response = await axios.post(
        "/api/update_price_products",
        { value: info },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      console.log("Update_products_price ....");
      // console.log("ADDED CONTENT : ", response);
      return Promise.resolve(response.data);
    } catch (error) {
      return Promise.reject(error);
    }
  };