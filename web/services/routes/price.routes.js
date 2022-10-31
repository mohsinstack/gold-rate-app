import express from "express";
import { Shopify, DataType } from "@shopify/shopify-api";

// const app = express();
const router = express.Router();
router.use(express.json());

// applyAuthMiddleware(app);

router.post("/api/update_price_products", async (req, res) => {
   try {
      const info = req.body.value;
    console.log("update price products calling11 ...",info)
    
    const session = await Shopify.Utils.loadCurrentSession(
      req,
      res,
      false
    );
    if(info.gold > 0)
    {

       const p_gold= await Add_Content_Metafield(session,'main_gold_rate',info.gold)
    }
    if(info.platinum > 0 )
    {
      
       const p_platinum= await Add_Content_Metafield(session,'main_platinum_price',info.platinum)
    }
    const { Product } = await import(
      `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
    );

    const countData = await Product.count({ session });
    console.log(countData)
   
    const productsInfo =await GetAllProductsValues(session,countData.count,info);
   
    return res.status(200).json({success:true,data:true})

   } catch (error) {
      console.log("error : ",error)
      return res.status(500).json({success:false,data:error})
   }
})
const ProductPriceUpdate = async(session,info,data)=>{
   try {
      
      const meta = data.metafieldData;
      const goldrate =Math.round( (info.gold * meta.gold_purity) /240);
      const goldweight = meta.gold_weight;
      const gold_original_value =  Math.round( goldrate * goldweight );
      const gold_disount = meta.gold_discount ?  Math.round( (gold_original_value * meta.gold_discount)/ 100) : 0; 
      const gold_final_value = Math.round( goldrate * goldweight ) - gold_disount ;  

      const platinumweight = meta.platinum_weight? meta.platinum_weight : 0;
      const platinumoriginal_value = platinumweight * info.platinum;
      const platinum_disount = meta.platinum_discount ? Math.round((platinumoriginal_value * Number(meta.platinum_discount)) /100) :0;
      const platinum_final_value = Math.round(info.platinum * platinumweight);

      const product_cno =meta.c_no ?  Math.round(meta.c_no) : 0
      const gold_original_value_temp = goldrate * goldweight
      const grand_original = Math.round((gold_original_value_temp + platinumoriginal_value + product_cno) * 2.125) ; 
      const gst_orginal = Math.round((grand_original* 0.03) / 1.03) + platinum_disount;

      const gemstone_discount = (meta.discount_on_gemstone && meta.gemstone_charges) ? Math.round((meta.gemstone_charges * Number(meta.discount_on_gemstone))/100) :0
      const gemstone_final_value =meta.gemstone_charges ?  (meta.gemstone_charges - gemstone_discount) : 0
  

      const making_charges_discount =(meta.making_charges && meta.discount_on_making)? Math.round(meta.making_charges * Number(meta.discount_on_making)  / 100):0
      const final_making_charges =meta.making_charges ? Math.round(meta.making_charges - making_charges_discount) :0
      const subtotal_orignal = Math.round(grand_original - gst_orginal)
      
      
      const diamondpolkiweight = (meta.polki_weight ?meta.polki_weight:0 + meta.diamond_weight?meta.diamond_weight:0)
      
      const diamondpolkiprice = Math.round(subtotal_orignal - final_making_charges - gemstone_final_value - gold_original_value)
      const diamond_disount =meta.discount_on_diamond ?Math.round(diamondpolkiprice * Number(meta.discount_on_diamond) / 100) : 0
      const diamond_final_value = Math.round(diamondpolkiprice)  - diamond_disount 
      const subtotal_final_amount = Math.round(gold_final_value + platinum_final_value + diamond_final_value + final_making_charges + gemstone_final_value) 
      const discountonmrp = meta.discount_on_mrp ? Math.round(subtotal_final_amount * Number(meta.discount_on_mrp) / 100) :0
      const subtotal_final = gold_final_value + diamond_final_value + platinum_final_value + gemstone_final_value + final_making_charges;
      
      const subtotal_after_discount = Math.round(subtotal_final_amount - discountonmrp) 
  
      const final_gst = Math.round(subtotal_after_discount * 0.03) 
     
      const finalprice = subtotal_after_discount + final_gst
      console.log("+++++++++++++++++++++++++++++++++++")
       
      console.log(`subtotal_after_discount
      products id : ${data.id}
      products title : ${data.title}
      gold_disount:${gold_disount}
      platinum_disount :${platinum_disount}
      diamond_disount: ${diamond_disount}
      finalprice : ${finalprice}
      gemstone_discount : ${gemstone_discount}
      grand_original: ${grand_original}
      `);
      const client = new Shopify.Clients.Graphql(
         session.shop,
         session.accessToken
       );
      const forData = await client.query({
         data: `mutation
         {
           productVariantUpdate(input: 
             {
               price: "${finalprice}",
               compareAtPrice:"${grand_original}", 
               id: "${data.variants.nodes[0].id}",
             })
             {
               product {
                 id
               }
             }
         }`,
       });
      //  console.log("for Data products data : ",forData)
      console.log("+++++++++++++++++++++++++++++++++++")
      return Promise.resolve(true);
   } catch (error) {
      console.log("PRoductPriceUpdate error : ",error);
      return Promise.reject(false);
   }

}
const productsGetquery = async(first,id)=>
{
   if(id)
   {
      return `{
         products (first:${first},after:"${id}") {
            pageInfo {
               hasNextPage
               endCursor
               hasPreviousPage
               startCursor
             }
            edges {
               node {
                 id
                 productType
                 title
                 variants(first: 1) {
                  nodes {
                    sku
                    id
                    price
                  }
                }
               }
             }
         }
       }`
   }else{
      return `{
         products (first: ${first}) {
            pageInfo {
               hasNextPage
               endCursor
               hasPreviousPage
               startCursor
             }
            edges {
               node {
                 id
                 productType
                 title
                 variants(first: 1) {
                  nodes {
                    sku
                    id
                    price
                  }
                }
               }
             }
         }
       }`
   }
}
const GetAllProductsValues = async(session,count,info)=>{
   try {
      const first = 2;
      const productsData = [];
       // `session` is built as part of the OAuth process
       const client = new Shopify.Clients.Graphql(
         session.shop,
         session.accessToken
       );
       let products = await client.query({
         data: await productsGetquery(first,0),
       });
       if(count > first)
       {
          let hasNextPage = products.body.data.products.pageInfo.hasNextPage;
          let endCursor = products.body.data.products.pageInfo.endCursor;
          let productArray = products.body.data.products.edges;
         //  console.log("first : ",hasNextPage,"\n",endCursor,"\n",productArray)
          for(let i = 0 ;i<count;i=i+first) 
          {
            let co = 0;
             productArray.map(async(data)=>{
               
                let id = data.node.id.split("Product/")[1]
                let metafieldData = await GetProductMetafieldsValues(session,id)
                console.log("first time products :",id);
                // console.log("metafieldData : ",metafieldData)
                const pro_data = {
                  id:id,
                  productType:data.node.productType,
                  title:data.node.title,
                  variants:data.node.variants,
                  metafieldData:metafieldData
               }
                const cal_price = await ProductPriceUpdate(session,info,pro_data);
              await productsData.push({
                  id:data.node.id,
                  productType:data.node.productType,
                  title:data.node.title,
                  variants:data.node.variants,
                  metafieldData:metafieldData
               })
               // console.log("----------------length : ",productsData.length)
             })
            if(hasNextPage)
            {
               // console.log("query : ",await productsGetquery(first,endCursor))
                const forData = await client.query({
                  data: await productsGetquery(first,endCursor),
                });
                 hasNextPage = forData.body.data.products.pageInfo.hasNextPage;
                 productArray = forData.body.data.products.edges;
                 endCursor = forData.body.data.products.pageInfo.endCursor;
            }
          }
       }
    return Promise.resolve(productsData)
   } catch (error) {
      console.log("GetAllProductsValues error : ",error)
      return Promise.reject(false)
   }
}
const GetProductMetafieldsValues = async (session,id)=>{
   try {
      const { Metafield } = await import(
         `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
       );
       const metaData =
    await Metafield.all({
      session: session,
      metafield: {"owner_id": id, "owner_resource": "product"},
    });
    var jsonData = {};
    metaData.map((data)=>{
      jsonData[data.key]=data.value; 
   })
   // console.log(jsonData)
    return Promise.resolve(jsonData)
   } catch (error) {
      console.log("GetProductMetafieldsValues error : ",error)
      return Promise.reject(false)
   }
}
//Content add in metafield using key/value
const Add_Content_Metafield = async (session, key, value) => {
   try {
     const { Metafield } = await import(
       `@shopify/shopify-api/dist/rest-resources/${Shopify.Context.API_VERSION}/index.js`
     );
     const metafield = new Metafield({ session: session });
     metafield.namespace = "custom";
     metafield.key = key;
     metafield.value = value;
     metafield.type = "number_decimal";
     const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
     const test = await client.post({
       path: "metafields",
       data: { metafield },
       type: DataType.JSON,
     });
     return Promise.resolve(test?.body?.metafield);
   } catch (error) {
     // console.log("ERROR ADD_CONTENT_METAFILED : ", error.message);
     return Promise.reject(error);
   }
 };

export default router;