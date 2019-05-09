const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const menusRouter = express.Router();

menusRouter.get('/', (req,res,next)=>{
  db.all('SELECT * FROM Menu',(err,rows)=>{
    if(err) {
      return res.sendStatus(500);
    }
    res.status(200).json({menus: rows});
  });
});

function validateMenu(req,res,next) {
  const menu = req.body.menu;
  if(!menu.title) {
    return res.sendStatus(400);
  }
  next();
}

menusRouter.post('/',validateMenu,(req,res,next)=>{
  db.run('INSERT INTO Menu (title) VALUES ($t)',{
    $t: req.body.menu.title
  }, function(err) {
    db.get(`SELECT * FROM Menu WHERE id=${this.lastID}`,(err,row)=>{
      res.status(201).json({ menu: row});
    });
  });
});

menusRouter.param('menuId', (req,res,next,id)=>{
  db.get(`SELECT * FROM Menu WHERE id=${id}`,(err,row)=>{
    if(err || !row) {
      return res.sendStatus(404);
    }
    req.menu = row;
    next();
  });
});

menusRouter.get('/:menuId',(req,res,next)=>{
  res.status(200).json({menu: req.menu});
});

menusRouter.put('/:menuId',validateMenu,(req,res,next)=>{
  db.run('UPDATE Menu SET title=$t WHERE id=$id', {
    $t: req.body.menu.title,
    $id: req.params.menuId
  }, (err)=>{
    if(err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Menu WHERE id=${req.params.menuId}`,(err,row)=>{
      res.status(200).json({menu: row});
    });
  });
});

menusRouter.delete('/:menuId',(req,res,next)=>{
  db.get(`SELECT * FROM MenuItem WHERE menu_id=${req.params.menuId}`,(err,row)=>{
    if(row) {
      return res.sendStatus(400);
    }

    db.run(`DELETE FROM Menu WHERE id=${req.params.menuId}`,(err)=>{
      if(err) {
        return res.sendStatus(500);
      }
      res.sendStatus(204);
    });
  });
});

menusRouter.get('/:menuId/menu-items',(req,res,next)=>{
  db.all(`SELECT * FROM MenuItem WHERE menu_id=${req.params.menuId}`,(err,rows)=>{
    if(err) {
      return res.sendStatus(500);
    }
    res.status(200).json({menuItems: rows});
  });
});

function validateMenuItem(req,res,next) {
  const menuItem = req.body.menuItem;
  if(!menuItem.name || !menuItem.description || !menuItem.inventory || !menuItem.price) {
    return res.sendStatus(400);
  }
  next();
}

menusRouter.post('/:menuId/menu-items',validateMenuItem,(req,res,next)=>{
  const item = req.body.menuItem;
  db.run('INSERT INTO MenuItem (name,description,inventory,price,menu_id) VALUES ($n,$d,$i,$p,$menuId)',{
    $n: item.name,
    $d: item.description,
    $i: item.inventory,
    $p: item.price,
    $menuId: req.params.menuId
  }, function(err) {
    if(err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM MenuItem WHERE id=${this.lastID}`,(err,row)=>{
      res.status(201).json({menuItem: row});
    });
  });
});

menusRouter.param('menuItemId',(req,res,next,id)=>{
  db.get(`SELECT * FROM MenuItem WHERE id=${id}`,(err,row)=>{
    if(err || !row) {
      return res.sendStatus(404);
    }
    next();
  });
});

menusRouter.put('/:menuId/menu-items/:menuItemId',validateMenuItem,(req,res,next)=>{
  const item = req.body.menuItem;
  db.run('UPDATE MenuItem SET name=$n, description=$d, inventory=$i, price=$p, menu_id=$menuId WHERE id=$id', {
    $n: item.name,
    $d: item.description,
    $i: item.inventory,
    $p: item.price,
    $menuId: req.params.menuId,
    $id: req.params.menuItemId
  }, (err)=>{
    if(err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM MenuItem WHERE id=${req.params.menuItemId}`,(err,row)=>{
      res.status(200).json({menuItem: row});
    });
  });
});

menusRouter.delete('/:menuId/menu-items/:menuItemId',(req,res,next)=>{
  db.run(`DELETE FROM MenuItem WHERE id=${req.params.menuItemId}`,(err)=>{
    if(err) {
      return res.sendStatus(500);
    }
    res.sendStatus(204);
  });
});

module.exports = menusRouter;
