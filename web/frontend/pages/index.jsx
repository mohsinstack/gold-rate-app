import {
  Card,
  Page,
  Layout,
  TextContainer,
  Image,
  Select,
  Stack,
  Button,
  Link,
  TextField,InlineError,
  Heading,
  FormLayout,
} from "@shopify/polaris";
import {useState, useCallback} from 'react';
import { useAppBridge } from "@shopify/app-bridge-react";
import {Update_products_price } from "../apicall/allapi";
export default function HomePage() {
  const [value14, setValue14] = useState('14K');
  const [goldValue,setGoldValue] = useState(0);
  const app = useAppBridge();
  const [loadingFlag, setloadingFlag] = useState(false);
  const [platinumValue,setPlatinumValue] = useState(0);
  const [error,setError] =useState("");
  const SubmitPrice =async() => {
    setloadingFlag(true);
        if(goldValue <= 0 && platinumValue <= 0)
        {
          setError("Please enter price of Gold and Platinum")
             console.log("error all");
             setloadingFlag(false);
        }else{
          console.log("called api update")
          setError("")
          try {
            const info={
              gold:goldValue,
              platinum:platinumValue
            }
            let response = await Update_products_price(app, info);
            console.log("response : ",response)
            if(response.success)
            {
              setloadingFlag(false);
            }else{
              console.log("error in api")
            }
          } catch (error) {
            setloadingFlag(false);
            console.log("error : ",error);
          }
           
        }
        // else if(goldValue > 0 && platinumValue > 0)
        // {
        //   setError("")
          
        //   console.log("both call")
        // }else if(goldValue > 0 && platinumValue<= 0)
        // {
        //   setError("")
        //   console.log("only gold price");
        // }else if(goldValue<= 0 && platinumValue>0)
        // {
        //   setError("")
        //   console.log("only platinum price")
        // }

  }
  return (
    <Page >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Stack
              wrap={false}
              spacing="extraTight"
              distribution="trailing"
              alignment="center"
            >
              <Stack.Item fill>
                <TextContainer spacing="loose">
                  <Heading>Gold And Platinum Update Price</Heading>
                  <FormLayout >
                  <TextField
                  type="number"
                    label="Gold Price"
                    value={goldValue}
                    onChange={(e) => {
                      setGoldValue(e);
                    }}
                    prefix="₹"
                    min={0}
                    placeholder="Enter Gold price"
                    autoComplete="off"
                  />
                  <TextField
                  type="number"
                    label="Platinum Price"
                    value={platinumValue}
                    onChange={(e) => {
                      setPlatinumValue(e);
                    }}
                    
                    min={0}
                    prefix="₹"
                    placeholder="Enter Platinum price"
                    autoComplete="off"
                  />
                </FormLayout>
                <InlineError message={error} />

                <Button primary onClick={SubmitPrice} loading={loadingFlag}>Save Gold and platinum Price</Button>
                </TextContainer>
              </Stack.Item>
            
            </Stack>
          </Card>
        </Layout.Section>
        
      </Layout>
    </Page>
  );
}
