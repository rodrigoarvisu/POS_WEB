
const express = require("express");
const app = express();
const path = require("path");
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const { error } = require("console");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

require('dotenv').config();


const conexion = mysql.createConnection({
    host: process.env.DB_HOST,  
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

conexion.connect((error) => {
    if(error){
        console.log("Error de conexion: " + error);
    }else{
        console.log("Conexion exitosa a MySQL");
    }
});


app.post('/login', async (req, res) => {
    const usuario = req.body.usuario;
    const contrasena = req.body.contrasena;

    const sql = `
    SELECT * FROM usuarios
    WHERE usuario = ? 
    `;

    conexion.query(sql, [usuario], async (error, resultados) => {
        if(error){
            console.log(error);
            res.send("Error en el login");
        }else{
            if(resultados.length > 0){
                const usuarioBD =resultados[0];
                const coincide =await bcrypt.compare(
                    contrasena, usuarioBD.contrasena
                );
                if(coincide){
                    res.redirect(`/pages/menu.html?login=1&usuario=${usuario}`);
                }else{
                res.redirect("/index.html?error=1");
                }
         }else{
            res.redirect("/pages/index.html?error=1");
         }
        }
    });
    
});


app.post('/registro', async (req, res) => {
    const nombre = req.body.nombre;
    const usuario = req.body.usuario;
    const contrasena = req.body.contrasena;
    const confirmar = req.body.confirmar;
    const passwordHash = await bcrypt.hash(contrasena, 10);

    if(contrasena === confirmar){
    
    const sql = `
    INSERT INTO usuarios(nombre, usuario, contrasena)
    VALUES (?, ?, ?)
    `;

    conexion.query(sql, [nombre, usuario, passwordHash], (error, resultado) => {
        if(error){
            console.log(error);
            res.redirect("/registro.html?error=1");
        }else{
            res.redirect("/registro.html?registro=1");
        }

    });
    }else{
        res.redirect("/registro.html?verificar=1");

    }
});


app.post('/productos', async (req, res) => {
    const codigo = req.body.codigo;
    const nombre = req.body.nombre;
    const precio_venta = req.body.precio_venta;
    const precio_compra = req.body.precio_compra;
    const stock = req.body.stock;

    const sql = `
    INSERT INTO productos(codigo, nombre, precio_venta, precio_compra, stock)
    VALUES (?, ?, ?, ?, ?)
    `;

    conexion.query(sql, [codigo, nombre, precio_venta, precio_compra, stock], (error, resultado) => {
        if(error){
            console.log(error);
            res.send("Error al guardar producto");
        }else{
            res.redirect("/productos.html?success=1");
        }
    });
    
});


app.get('/obtener-productos', (req, res) => {
    const sql = `
    SELECT * FROM productos
    `;

    conexion.query(sql, (error, resultados) => {
        if(error){
            console.log(error);
            res.json([]);
        }else{
            res.json(resultados);
        }
    })
})


app.delete('/eliminar-producto/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
    DELETE FROM productos
    WHERE id = ?
    `;

    conexion.query(sql, [id], (error, resultado) => {
        if(error){
            console.log(error);
             res.status(500).send("No se pudo eliminar el producto");
        }else{
             res.send("Producto eliminado correctamente");
        }
    })
})


app.put('/actualizar-producto/:id', (req, res) => {
    const id = req.params.id;
    const { codigo, nombre, precio_venta, precio_compra, stock } = req.body;

    const sql = `
    UPDATE productos
    SET codigo = ?, nombre = ?, precio_venta = ?, precio_compra = ?, stock = ?
    WHERE id = ?
    `;

    conexion.query(
        sql, 
        [codigo, nombre, precio_venta, precio_compra, stock, id], 
        (error, resultado) => {
            if(error){
                console.log(error);
                res.status(500).send('Error al actualizar');
            }else{
                res.send('Producto actualizado correctamente');
            }
        }
    );
});


app.post('/guardar-venta', (req, res) => {
    const carrito = req.body.carrito;
    const total = req.body.total;

    const sqlVenta = `
    INSERT INTO ventas(total, fecha)
    VALUES (?, NOW())
    `;

    conexion.query(
        sqlVenta,
        [total],
        (error, resultado) => {
            if(error){
                console.log(error);
                return res.status(500)
                .send('Error al guardar venta');
            }
            const ventaId = resultado.insertId;

            carrito.forEach(producto => {
                const sqlDetalle = `
                INSERT INTO detalle_ventas(
                venta_id,
                producto_id,
                cantidad,
                precio,
                subtotal)
                VALUES (?,?,?,?,?)
                `;

                conexion.query(
                    sqlDetalle,
                    [
                        ventaId,
                        producto.id,
                        producto.cantidad,
                        producto.precio,
                        producto.total
                    ]
                );

                const sqlStock = `
                UPDATE productos
                SET stock = stock - ?
                WHERE id = ?
                `;

                conexion.query(
                    sqlStock,
                    [
                        producto.cantidad,
                        producto.id
                    ]
                );
            });
            res.send('Venta guardada correctamente');
        }
    );
});


app.get('/estadisticas', (req, res) => {
    const sqlProductos = `
    SELECT COUNT(*) AS total
    FROM productos 
    `;

    const sqlBajoStock = `
    SELECT COUNT(*) AS total
    FROM productos
    WHERE stock > 0
    AND stock <= 4
    `;

    const sqlSinStock = `
    SELECT COUNT(*) AS total 
    FROM productos
    WHERE stock <= 0
    `;

    conexion.query(sqlProductos, (error, productos) => {
        if(error){
            return res.json({});
        }

        conexion.query(sqlBajoStock, (error, bajoStock) => {
            if(error) {
                return res.json({});
            }

            conexion.query(sqlSinStock, (error, sinStock) => {
                if(error) {
                    return res.json({});
                }

                res.json({
                    productos:
                    productos[0].total,

                    bajoStock:
                    bajoStock[0].total,

                    sinStock:
                    sinStock[0].total,
                });
            });
        });
    });
});


app.get('/ventas-hoy', (req, res) => {
    const sql = `
    SELECT SUM(total) AS totalVentas
    FROM ventas
    WHERE DATE(fecha) = CURDATE()
    `;

    conexion.query(sql, (error, resultados) => {
        if(error){
            console.log(error);
            res.json({
                totalVentas: 0
            });
        }else{
            res.json({
                totalVentas:
                resultados[0].totalVentas || 0
            });
        }
    });
});


app.get('/ventas-semana', (req, res) => {
    const sql = `
    SELECT 
    DAYNAME(fecha) AS dia,
    SUM(total) AS total
    FROM ventas
    WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DAYNAME(fecha)
    ORDER BY MIN(fecha)
    `;

    conexion.query(sql, (error, resultados) => {
        if(error){
            console.log(error);
            return res.status(500).send('Error');
        }
        res.json(resultados);
    });
});


app.get('/ventas-ayer', (req, res) => {
    const sql = `
    SELECT COALESCE(SUM(total), 0) AS totalVentas
    FROM ventas
    WHERE DATE(fecha) = DATE(NOW()) - INTERVAL 1 DAY
    `;

    conexion.query(sql, (error, resultados) => {
        if(error){
            return res.status(500).json({ error: error.message });
        }
        res.json({ totalVentas: resultados[0].totalVentas });
    });
});


app.get('/utilidad-inicio', (req, res) => {
    const sql = `
    SELECT COALESCE(
    SUM(dv.cantidad * (dv.precio - p.precio_compra)), 0
    ) AS utilidad
     FROM detalle_ventas dv 
     JOIN productos p ON dv.producto_id = p.id
     JOIN ventas v ON dv.venta_id = v.id
     WHERE DATE(v.fecha) = CURDATE()
     `;

     conexion.query(sql, (error, resultados) => {
        if(error){
            return res.status(500).json({ error: error.message });
        }
        res.json({ utilidad: resultados[0].utilidad });
     });
});


app.get('/obtener-reportes/:periodo', (req, res) => {

    const periodo = req.params.periodo;

    let whereVentas = '';
    let whereCompras = '';

    if(periodo === 'Hoy'){

        whereVentas = `
        DATE(fecha) = CURDATE()
        `;

        whereCompras = `
        DATE(fecha) = CURDATE()
        `;
    }

    else if(periodo === 'Esta semana'){

        whereVentas = `
        YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
        `;

        whereCompras = `
        YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
        `;
    }

    else if(periodo === 'Este mes'){

        whereVentas = `
        MONTH(fecha) = MONTH(CURDATE())
        AND YEAR(fecha) = YEAR(CURDATE())
        `;

        whereCompras = `
        MONTH(fecha) = MONTH(CURDATE())
        AND YEAR(fecha) = YEAR(CURDATE())
        `;
    }

    else if(periodo === 'Este año'){

        whereVentas = `
        YEAR(fecha) = YEAR(CURDATE())
        `;

        whereCompras = `
        YEAR(fecha) = YEAR(CURDATE())
        `;
    }

    const sqlVentas = `
    SELECT
        COALESCE(SUM(total), 0) AS ventas,
        COALESCE(ROUND(AVG(total), 2), 0) AS ticket
    FROM ventas
    WHERE ${whereVentas}
    `;

    const sqlUtilidad = `
    SELECT
        COALESCE(
            SUM(
                dv.cantidad *
                (dv.precio - p.precio_compra)
            ),
            0
        ) AS utilidad
    FROM detalle_ventas dv
    JOIN productos p
        ON dv.producto_id = p.id
    JOIN ventas v
        ON dv.venta_id = v.id
    WHERE ${whereVentas.replaceAll('fecha', 'v.fecha')}
    `;

    const sqlCompras = `
    SELECT
        COALESCE(SUM(total), 0) AS compras
    FROM compras
    WHERE ${whereCompras}
    `;

    conexion.query(sqlVentas, (errorVentas, resultadoVentas) => {

        if(errorVentas){
            console.log(errorVentas);
            return res.status(500).json({
                error: 'Error ventas'
            });
        }

        conexion.query(sqlUtilidad, (errorUtilidad, resultadoUtilidad) => {

            if(errorUtilidad){
                console.log(errorUtilidad);
                return res.status(500).json({
                    error: 'Error utilidad'
                });
            }

            conexion.query(sqlCompras, (errorCompras, resultadoCompras) => {

                if(errorCompras){
                    console.log(errorCompras);
                    return res.status(500).json({
                        error: 'Error compras'
                    });
                }

                res.json({
                    ventas: resultadoVentas[0].ventas,
                    compras: resultadoCompras[0].compras,
                    utilidad: resultadoUtilidad[0].utilidad,
                    ticketPromedio: resultadoVentas[0].ticket
                });

            });

        });

    });

});


app.get('/productos-mas-vendidos/:periodo', (req, res) => {
     const periodo = req.params.periodo;

     let where = '';

     if(periodo === 'Hoy'){
        where = `
        DATE(v.fecha) = CURDATE()
        `;
     }

     else if(periodo === 'Esta semana'){
        where = `
        YEARWEEK(v.fecha, 1) = YEARWEEK(CURDATE(), 1)
        `;
     }

     else if(periodo === 'Este mes'){
        where = `
        MONTH(v.fecha) = MONTH(CURDATE())
        AND YEAR(v.fecha) = YEAR(CURDATE())
        `;
     }

     else if (periodo === 'Este año'){
        where = `
        YEAR(v.fecha) = YEAR(CURDATE())
        `;
     }

     const sql = `
     SELECT 

     p.nombre, 
     SUM(dv.cantidad) AS vendidos 
     FROM detalle_ventas dv 
     JOIN productos p 
     ON dv.producto_id = p.id
     JOIN ventas v 
     ON dv.venta_id = v.id

     WHERE ${where}
     
     GROUP BY p.nombre
     ORDER BY vendidos DESC
     LIMIT 5
     `;

     conexion.query(sql, (error, resultados) => {
        if(error){
            console.log(error);
            return res.status(500). json({
                error: 'Error consulta'
            });
        }
        res.json(resultados);
     });
});


app.post('/guardar-compra', (req, res) => {
    const { proveedor, folio, total, productos } = req.body;

    if (!proveedor || !productos || productos.length === 0) {
        return res.status(400).json({ mensaje: 'Datos incompletos' });
    }

    conexion.query(
        'INSERT INTO compras(proveedor, fecha, total, folio) VALUES(?, NOW(),?,?)',
        [proveedor, total, folio || null],
        (err, resultado) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ mensaje: 'Error al guardar compra' });
            }

            const compraId = resultado.insertId;

            productos.forEach(p => {
                const subtotal = p.precio_compra * p.cantidad;

                conexion.query(
                    'INSERT INTO detalle_compras(compra_id, producto_id, cantidad, precio_compra, subtotal) VALUES(?,?,?,?,?)',
                    [compraId, p.id, p.cantidad, p.precio_compra, subtotal]
                );

                
                conexion.query(
                    'UPDATE productos SET stock = stock + ? WHERE id = ?',
                    [p.cantidad, p.id]
                );
            });

            res.json({ mensaje: 'Compra guardada correctamente' });
        }
    );
});


app.get('/resumen-compras', (req, res) => {
    const sql = `
    SELECT
        SUM(CASE WHEN DATE(fecha) = CURDATE() THEN total ELSE 0 END) AS total_hoy,
        COUNT(CASE WHEN DATE(fecha) = CURDATE() THEN 1 END) AS cant_hoy,
        SUM(
    CASE
        WHEN fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        AND fecha < DATE_ADD(
            DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
            INTERVAL 7 DAY
        )
        THEN total
        ELSE 0
        END
        ) AS total_semana,

    COUNT(
    CASE
        WHEN fecha >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        AND fecha < DATE_ADD(
            DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY),
            INTERVAL 7 DAY
        )
        THEN 1
        END
        ) AS cant_semana,
        SUM(CASE WHEN MONTH(fecha) = MONTH(NOW()) AND YEAR(fecha) = YEAR(NOW()) THEN total ELSE 0 END) AS total_mes,
        COUNT(CASE WHEN MONTH(fecha) = MONTH(NOW()) AND YEAR(fecha) = YEAR(NOW()) THEN 1 END) AS cant_mes,
        SUM(CASE WHEN YEAR(fecha) = YEAR(NOW()) THEN total ELSE 0 END) AS total_año,
        COUNT(CASE WHEN YEAR(fecha) = YEAR(NOW()) THEN 1 END) AS cant_año
    FROM compras
    `;
    conexion.query(sql, (error, r) => {
        if (error) return res.status(500).json({});
        const d = r[0];
        res.json({
            hoy:    { total: d.total_hoy || 0,    cantidad: d.cant_hoy || 0 },
            semana: { total: d.total_semana || 0, cantidad: d.cant_semana || 0 },
            mes:    { total: d.total_mes || 0,    cantidad: d.cant_mes || 0 },
            año:    { total: d.total_año || 0,    cantidad: d.cant_año || 0 }
        });
    });
});


app.get('/historial-compras', (req, res) => {
    const sql = `
    SELECT * FROM compras ORDER BY fecha DESC LIMIT 10
    `;
    conexion.query(sql, (error, resultados) => {
        if(error) return res.status(500).json([]);
        res.json(resultados);
    });
});


app.get('/detalle-compra/:id', (req, res) => {
    const id = req.params.id;
    conexion.query('SELECT * FROM compras WHERE id = ?', [id], (err, compra) => {
        if (err) return res.status(500).json({});
        conexion.query(`
            SELECT dc.*, p.nombre FROM detalle_compras dc
            JOIN productos p ON dc.producto_id = p.id
            WHERE dc.compra_id = ?`, [id], (err2, productos) => {
            if (err2) return res.status(500).json({});
            res.json({ compra: compra[0], productos });
        });
    });
});


app.get('/productos-bajo-stock', (req, res) => {
    const sql = `
    SELECT nombre, stock 
    FROM productos 
    WHERE stock > 0
    AND stock <= 4
    ORDER BY stock ASC
    `;

    conexion.query(sql, (error, resultados) => {
        if(error){
            console.log(error);
            return res.json([]);
        }
        res.json(resultados);
    });
});


app.get('/productos-sin-stock', (req, res) => {
    const sql = `
    SELECT nombre, stock 
    FROM productos
    WHERE stock <= 0
    ORDER BY nombre ASC
    `;

     conexion.query(sql, (error, resultados) => {
        if(error){
            console.log(error);
            return res.json([]);
        }
        res.json(resultados);
    });
})


app.get('/historial-ventas', (req, res) => {
    conexion.query(
        'SELECT * FROM ventas ORDER BY fecha DESC',
        (error, resultados) => {
            if (error) return res.status(500).json([]);
            res.json(resultados);
        }
    );
});


app.get('/detalle-venta/:id', (req, res) => {
     const id = req.params.id;
    conexion.query('SELECT * FROM ventas WHERE id = ?', [id], (err, venta) => {
        if (err) return res.status(500).json({});
        conexion.query(`
            SELECT dv.*, p.nombre FROM detalle_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = ?`, [id], (err2, productos) => {
            if (err2) return res.status(500).json({});
            res.json({ venta: venta[0], productos });
        });
    });
});



app.listen(3000, '0.0.0.0', () => {
    console.log("Servidor corriendo en puerto 3000");
})