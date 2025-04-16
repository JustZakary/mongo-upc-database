// Insert document into the upcs collection
db.upcs.insertOne({
  _id: '6000191272217',
  image: 'https://i5.walmartimages.com/asr/2a12b9b7-514b-4d06-b51a-f532038ce6c8.a22aaec62342a7c4e4eee005e9180106.jpeg',
  retailers: [
    {
      retailer: 'Walmart.ca',
      productUrl: 'https://www.walmart.ca/en/ip/Great-Value-Frozen-Cultivated-Blueberries/6000191272217',
      price: 13.63,
      currency: 'CAD',
      description:
        'Enjoy the sweetness of blueberries all year round with this family size pack of frozen Great Value Cultivated Blueberries. Enjoy these blueberries on their own, baked into pies, blended into smoothies, or mixed into yogurt.',
      sku: '6000191272217',
    },
  ],
  title: 'Great Value Frozen Cultivated Blueberries, 1.75 kg',
  weight: 1.75,
  weightUnit: 'kg',
});

//Insertmany
db.upcs.insertMany([
  {
    _id: '00627735259864',
    image: 'https://i5.walmartimages.com/asr/5645c849-ffb4-4d99-af0f-b7af1e521c96.af822188b70a4a7de9b3430716c5ed7c.jpeg',
    retailers: [
      {
        retailer: 'Walmart.ca',
        productUrl: 'https://www.walmart.ca/en/ip/Great-Value-Frozen-Raspberries/2UWPR6JZ4L8J',
        price: 4.44,
        currency: 'CAD',
        description: 'Great for Baking\n No added sugar',
        sku: '2UWPR6JZ4L8J',
      },
    ],
    title: 'Great Value Frozen Raspberries, 400 g',
    weight: 400,
    weightUnit: 'g',
  },
  {
    _id: '00627735263403',
    image: 'https://i5.walmartimages.com/asr/c6709ca6-8d98-4e1b-9393-20dac80932cc.f3b9360ea46f35ea7e574a8fd2c6a0d3.jpeg',
    retailers: [
      {
        retailer: 'Walmart.ca',
        productUrl: 'https://www.walmart.ca/en/ip/GV-BLACKBERRIES/6UGPXUKJH63S',
        price: 4.44,
        currency: 'CAD',
        description:
          'Enjoy summer fruit year-round with Great Value Blackberries. These frozen blackberries bring a sweet, slightly tart note to smoothies, baked goods, and various frozen blackberry recipes. Thaw them in the refrigerator overnight as a garnish for your breakfast oatmeal or yogurt. Try the recipe printed on the package for a Blackberry Lemon Swirl Cake that’s sure to please the berry lovers in your household. The locked-in, frozen goodness is always within reach in your freezer whenever you need a delicious berry kick. Remember to reseal the bag to keep unused berries fresh for the next time.',
        sku: '6UGPXUKJH63S',
      },
    ],
    title: 'GV BLACKBERRIES, GREAT VALUE PL GV BLACKBERRIES',
    weight: 300,
    weightUnit: 'g',
  },
]);

//Find
db.upcs.find({_id: '00627735263403'}).pretty();

//UpdateOne
db.upcs.updateOne({_id: '00627735263403'}, {$set: {weight: 400}});

//Updatemany
db.upcs.updateMany({weight: 400, weightUnit: 'g'}, {$set: {weight: 500}}); //Update all documents with weight 400 to 500

//DeleteOne
db.upcs.deleteOne({_id: '00627735263403'}); //Delete document with UPC 196942081198

//DeleteMany
db.upcs.deleteMany({weight: 500}); //Delete all documents with weight 500

//Aggregation (Count all products by retailer)
db.upcs.aggregate([
  {
    $unwind: '$retailers',
  },
  {
    $group: {
      _id: '$retailers.retailer',
      count: {$sum: 1},
    },
  },
]);

//Aggregation (Count all products by unit of weight)
db.upcs.aggregate([
  {
    $group: {
      _id: '$weightUnit',
      count: {$sum: 1},
    },
  },
]);

//Sorting
db.upcs.find().sort({title: 1}); //Sort by title in ascending order
db.upcs.find().sort({title: -1}); //Sort by title in descending order

//Indexing (Create index on price)
db.upcs.createIndex({price: 1}); //Create index on price in ascending order

//Text Search
db.upcs.createIndex({title: 'text', description: 'text'}); //Create text index on title and description

//Regex Query
db.upcs.find({title: {$regex: '^Great Value'}}); //Find all products with title starting with "Great Value"
