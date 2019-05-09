const express = require('express');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const employeesRouter = express.Router();

employeesRouter.get('/', (req,res,next)=>{
  db.all('SELECT * FROM Employee WHERE is_current_employee=1',(err,rows)=>{
    if(err) {
      return res.sendStatus(500);
    }

    res.status(200).json({ employees: rows});
  });
});

function validateEmployee(req,res,next) {
  const emp = req.body.employee;
  if(!emp.name || !emp.position || !emp.wage) {
    return res.sendStatus(400);
  }
  next();
}

employeesRouter.post('/', validateEmployee, (req,res,next)=>{
  const emp = req.body.employee;
  db.run('INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($n, $p, $w, $ce)', {
    $n: emp.name,
    $p: emp.position,
    $w: emp.wage,
    $ce: emp.is_current_employee || 1
  }, function(err) {
    if(err) {
      return res.sendStatus(500);
    }

    db.get(`SELECT * FROM Employee WHERE id=${this.lastID}`, (err, row)=>{
      res.status(201).json({employee: row});
    })
  });
});

employeesRouter.param('employeeId', (req,res,next,id)=>{
    db.get(`SELECT * FROM Employee WHERE id=${id}`,(err,row)=>{
      if(err || !row) {
        return res.sendStatus(404);
      }

      req.employee = row;
      next();
    })
});

employeesRouter.get('/:employeeId', (req,res,next)=>{
  res.status(200).json({employee: req.employee});
});

employeesRouter.put('/:employeeId', validateEmployee, (req,res,next)=>{
  const emp = req.body.employee;
  db.run('UPDATE Employee SET name=$n, position=$p, wage=$w, is_current_employee=$ce WHERE id=$id', {
    $n: emp.name,
    $p: emp.position,
    $w: emp.wage,
    $ce: emp.is_current_employee || 1,
    $id: req.params.employeeId
  }, (err)=>{
    if(err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Employee WHERE id=${req.params.employeeId}`,(err,row)=>{
      res.status(200).json({employee: row });
    });
  });
});

employeesRouter.delete('/:employeeId', (req,res,next)=>{
  db.run(`UPDATE Employee SET is_current_employee=0 WHERE id=${req.params.employeeId}`,(err)=>{
    db.get(`SELECT * FROM Employee WHERE id=${req.params.employeeId}`,(err,row)=>{
      res.status(200).json({employee: row});
    });
  });
});

employeesRouter.get('/:employeeId/timesheets',(req,res,next)=>{
  db.all(`SELECT * FROM Timesheet WHERE employee_id=${req.params.employeeId}`,(err, rows)=>{
    if(err) {
      return res.sendStatus(500);
    }

    res.status(200).json({timesheets: rows});
  });
});

function validateTimesheet(req,res,next) {
  const ts = req.body.timesheet;
  if(!ts.hours || !ts.rate || !ts.date) {
    return res.sendStatus(400);
  }
  next();
}

employeesRouter.post('/:employeeId/timesheets',validateTimesheet, (req,res,next)=>{
  const ts = req.body.timesheet;
  db.run('INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($h,$r,$d,$e)', {
    $h: ts.hours,
    $r: ts.rate,
    $d: ts.date,
    $e: req.params.employeeId
  }, function(err) {
    if(err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Timesheet WHERE id=${this.lastID}`,(err,row)=>{
      res.status(201).json({timesheet: row});
    });
  });
});

employeesRouter.param('timesheetId',(req,res,next,id)=>{
  db.get(`SELECT * FROM Timesheet WHERE id=${id}`,(err,row)=>{
    if(err || !row) {
      return res.sendStatus(404);
    }
    next();
  });
});

employeesRouter.put('/:employeeId/timesheets/:timesheetId',validateTimesheet,(req,res,next)=>{
  const ts = req.body.timesheet;
  db.run('UPDATE Timesheet SET hours=$h, rate=$r, date=$d, employee_id=$empId WHERE id=$timeId', {
    $h: ts.hours,
    $r: ts.rate,
    $d: ts.date,
    $empId: req.params.employeeId,
    $timeId: req.params.timesheetId
  }, (err)=>{
    if(err) {
      return res.sendStatus(500);
    }
    db.get(`SELECT * FROM Timesheet WHERE id=${req.params.timesheetId}`, (err,row)=>{
      res.status(200).json({timesheet: row});
    });
  });
});

employeesRouter.delete('/:employeeId/timesheets/:timesheetId', (req,res,next)=>{
  db.run(`DELETE FROM Timesheet WHERE id=${req.params.timesheetId}`,(err)=>{
    if(err) {
      return res.sendStatus(500);
    }
    res.sendStatus(204);
  })
});

module.exports = employeesRouter;
