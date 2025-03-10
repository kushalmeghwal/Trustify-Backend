const { connectNeo4j }=require('../config/database');

let neo4jDriver;
try{
    neo4jDriver = connectNeo4j();
}catch(error){
    console.error("falied to connect neo4j");
    process.exit(1);
}
//add product
 const addProductCar = async(req,res)=>{
    console.log("req received");
    let session;
    try{
        const{brand,year_of_purchase,fule_type,transmission,km_driven,owner,p_title,p_description,price,img_urls}= req.body;
        if(!brand||!year_of_purchase||!fule_type||!transmission||!km_driven||!p_title||!price||!owner||!img_urls){
            return res.status(400).json({error:'fill requeired(* marked) fields'});
        }
        session = neo4jDriver.session();
        const query =`CREATE(p:Product{
            pid:apoc.create.uuid(),
            category:'Car',
            brand:$brand,
            year_of_purchase:$year_of_purchase,
            fule_type:$fule_type,
            transmission:$transmission,
            km_driven:$km_driven,
            owner:$owner,
            price:$price,
            p_title:$p_title,
            p_description:$p_description,
            p_img:$img_urls,
            date_added:date()}
            ) RETURN p`;
        const result =  await session.run(query,{
            brand,
            year_of_purchase,
            fule_type,
            transmission,
            km_driven,
            owner,
            price,
            p_title,
            p_description,
            img_urls
        })
        const product =  result.records[0].get('p').properties;
        console.log(product);
        res.status(201).json({success:true,product});
    }catch(error){
        console.error('error while adding product ',error);
        res.status(500).json({error:'internal server error please try again'})

    }finally{
        //await session.close();
       // await neo4jDriver.close();
      }
}
//get product
 const getProduct = async (req,res)=>{
    let session;
      try{
         session = neo4jDriver.session();
        const query=`
        MATCH (p:Product)
        RETURN p
        ORDER BY p.date_added DESC
        `;
        const result = await session.run(query);
        console.log(result.records[0]);
        const products = result.records.map((record)=>{
            const product = record.get('p').properties;
            return{
                pid:product.pid,
                brand:product.brand,
                year_of_purchase:product.year_of_purchase,
                fule_type:product.fule_type,
                km_driven:product.km_driven,
                transmission:product.transmission,
                owner:product.owner,
                price:product.price,
                p_title:product.p_title,
                p_description:product.p_description,
                p_img:product.p_img
            };
        });
        res.status(200).json({ success: true, products });
      }catch(error){
        console.error('Error retrieving products:', error);
        res.status(500).json({ error: 'Internal server error' });
      }finally{
        await session.close();
        await neo4jDriver.close();
      }
}
module.exports={getProduct,addProductCar};