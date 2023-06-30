const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemSchema = new mongoose.Schema({
  name: {
      type: String,
      required: [true, "Name is required"]
  }
})

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item ({
  name: "Welcome to the todolist app!"
})

const item2 = new Item ({
  name: "Click on the + button to add your todolist"
})

const item3 = new Item ({
  name: "<= Click this to delete the list"
})

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  items: [itemSchema]
})

const List = mongoose.model("List", listSchema);

async function getItems(){
  const Items = await Item.find({});
  return Items;
}

app.get("/", function(req, res) {
  const day = date.getDate();
  getItems().then(function(foundItems){
    if(foundItems.length === 0){
      Item.insertMany([item1, item2, item3]);
      res.redirect("/");
    } else{
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const day = date.getDate();

  const itemInput = new Item ({
    name: itemName
  })

  if(listName === day){
    itemInput.save();
    res.redirect("/");
  } else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(itemInput);
      foundList.save();
      res.redirect(`/${listName}`);
    })
  }
});

app.post("/delete", function(req, res){
  const itemId = req.body.checkbox;
  const listName = req.body.listName;
  const day = date.getDate();

  if(listName === day){
    Item.findByIdAndRemove(itemId, function(err){
      if(!err){
        console.log("Delete success");
      }
    });
    res.redirect("/");
  } else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, function (err, foundList){
      if(!err){
        res.redirect(`/${listName}`);
      }
    })
  }
})

app.get("/:listId", function(req, res){
  const customList = _.capitalize(req.params.listId);
  
  List.findOne({name: customList}, function(err, results){
    if(!err){
      if(!results){
        const list = new List({
          name: customList,
          items: defaultItems
        })
        list.save();
        res.redirect(`/${customList}`);
      } else{
        res.render("List", {listTitle: results.name, newListItems: results.items});
      }
    }
  })
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
