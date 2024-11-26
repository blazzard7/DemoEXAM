const express = require('express');
const cors = require('cors');
const path = require('path'); 
const ejs = require('ejs');
const app = express();
const OrderStatuses = {
    PENDING: 'в ожидании запчастей',
    IN_PROGRESS: 'в процессе ремонта',
    COMPLETED: 'готова к выдаче',
    NEW: 'новая заявка',
    REPAIR: 'в процессе ремонта',
    READY: 'завершена'
};

app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 


class Order {
    constructor(number, date, typeEquip, model, description, client, phone, status, stage, employee,comment ) {
      this.number = number;
      this.date = date;
      this.typeEquip = typeEquip;
      this.model= model;
      this.description = description;
      this.client = client;
      this.phone = phone;
      this.status = status;
      this.stage = stage;
      this.employee = employee;
      this.commnet = comment;
      }
}
let repo = [{
    number: 1,
    date: "02-02-2005",
    typeEquip:"Мышь",
    model:"DEXP",
    description: "Не работает",
    client: "Иван Золо",
    phone:"+78005553535",
    status: OrderStatuses.NEW,
    stage: "ожидание запчастей",
    employee:"Коротаев А.А"
    }];
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
    
app.get("/orders", (req, res) => {
      res.render("orders", { repo });
});
app.get("/ord/new", (req, res) => {
    res.render('new_order'); 
});
app.post("/ord", (req, res) => {
    const ord = req.body;
    const {
        number,
        date,
        typeEquip,
        model,
        description,
        client,
        phone,
        status,
        stage,
        employee,
        comment,
    } = req.body;
    
    const orderNumber = parseInt(number);
    if (isNaN(orderNumber)) {
        return res.status(400).send('Некорректный номер заказа.');
    }
    const phoneRegex =/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/; 
    if (!phoneRegex.test(ord.phone)) {
        return res.status(400).send('Некорректный номер телефона');
    }
  
    const newOrder = new Order(
        orderNumber,
        date,
        typeEquip,
        model,
        description,
        client,
        phone,
        status,
        stage,
        employee,
        comment,
    );
    repo.push(newOrder);
    res.send(newOrder);
});
app.get("/orders/:number/update", (req, res) => {
    const { number } = req.params;
    const orderIndex = repo.findIndex(order => order.number === parseInt(number));
    if (orderIndex === -1) {
      return res.status(404).send('заявка не найдена');
    }
    res.render('update_order', { order: repo[orderIndex] }); 
  });
  
app.post("/orders/:number", (req, res) => {
    const orderNumber = parseInt(req.params.number);
    const updatedOrder = req.body;
    const number = parseInt(req.params.number);
    
    if (isNaN(number) || number <= 0) {
      return res.status(400).json({ error: "некорректный номер заявки", success: false });
    }
        const orderIndex = repo.findIndex(order => order.number === orderNumber);
    
        if (orderIndex === -1) {
            return res.status(404).json({ error: "Заявка не найдена" });
        }
       
        repo[orderIndex].stage = updatedOrder.stage;
        
        if (updatedOrder.stage === "готова к выдаче") {
          repo[orderIndex].status = OrderStatuses.READY; 
        } else if(updatedOrder.stage ==="в процессе ремонта") {
          repo[orderIndex].status = OrderStatuses.REPAIR;
        }
        else{
            repo[orderIndex].status = OrderStatuses.NEW; 
        }
        repo[orderIndex].description = updatedOrder.description || repo[orderIndex].description;
        repo[orderIndex].employee = updatedOrder.employee || repo[orderIndex].employee;
        repo[orderIndex].comment = updatedOrder.comment || repo[orderIndex].comment;
        const previousStatus = repo[orderIndex].status;
        res.json({
            order: repo[orderIndex],
            stageChange: previousStatus !== repo[orderIndex].status, 
            orderNumber: repo[orderIndex].number,
            stage: updatedOrder.stage,
            success: true
        });
});
app.get("/search", (req, res) => {
    const { num, param, typeEquip, model, description, client, status } = req.query; 
    let results = [];
  
    if (num) {
      const number = parseInt(num);
      if (!isNaN(number)) {
        const order = repo.find(order => order.number === number);
        if (order) results.push(order);
      }
    } else if (param) {
      if (typeof param !== 'string' || param.trim() === '') {
        console.error("Error: 'param' query parameter is missing or not a string:", param);
        res.status(400).send("Invalid search parameter");
        return;
      }
  
      
      results = repo.filter(order => {
          const searchTerm = param.toLowerCase();
          if (typeEquip === 'typeEquip'){
              return order.typeEquip.toLowerCase().includes(searchTerm)
          } else if(model === 'model'){
              return order.model.toLowerCase().includes(searchTerm)
          } else if (description === 'description'){
              return order.description.toLowerCase().includes(searchTerm)
          } else if (client === 'client'){
              return order.client.toLowerCase().includes(searchTerm)
          } else if (status === 'status'){
              return order.status.toLowerCase().includes(searchTerm)
          }
          return false;
      });
  
    }
  
    res.render("search", { orders: results });
  });

app.get("/search_form", (req, res) => {
  res.render("search_form");
});
app.get('/stats', (req, res) => {
    const completedCount = repo.filter(order => order.status === "выполнено").length;
    const problemCounts = {};
    repo.forEach(order => {
        const description = order.description; 
        problemCounts[description] = (problemCounts[description] || 0) + 1;
    });
  
    res.render('stats',{ completedCount, problemCounts });
  });
app.listen(7007);