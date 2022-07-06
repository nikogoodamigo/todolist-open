//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const popup = require("popups");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const Laundry = new Item({
  name: "Laundry"
});

const Cleaning = new Item({
  name: "Cleaning"
});

const Cooking = new Item({
  name: "Cooking"
});

const defaultItems = [Laundry, Cleaning, Cooking]; //list of items added if the list is empty

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Default items has been added!");
        }
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.deleteOne({_id: checkedItemId}, function(err){
      if(err){
        console.log(err);
      }
      else{
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/:listName", function(req,res){
  const requestedListName = _.capitalize(req.params.listName);

  if(requestedListName != "Favicon.ico"){ //needed because the code made list Favicon.io automatically
  List.findOne({name: requestedListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: requestedListName,
          items: defaultItems
        });
        list.save();
        setTimeout(function(){res.redirect("/" + requestedListName);}, 1000); //list is created slower than the code runs, so I added a small delay
      }
      else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
}

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    if(itemName === ""){
      console.log("Cant add empty");
      res.redirect("/");
    }
    else{
      item.save();
      res.redirect("/");
    }
  }
  else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started");
});
