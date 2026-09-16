import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { Propietario, TipoTitular } from '../../propietarios/entities/propietario.entity';
import {
  Administrador,
  RolAdministrador,
} from '../../administradores/entities/administrador.entity';
import { Cliente } from '../../users/entities/cliente.entity';
import { Property, PropertyStatus, PropertyType } from '../../properties/entities/property.entity';
import { PropertyImage } from '../../property-images/entities/property-image.entity';
import { BlockedPeriod } from '../../blocked-periods/entities/blocked-period.entity';
import {
  Reservation,
  ReservationStatus,
} from '../../reservations/entities/reservation.entity';
import { Payment, PaymentStatus } from '../../payments/entities/payment.entity';
import {
  Cancellation,
  TipoUsuarioCancelacion,
} from '../../cancellations/entities/cancellation.entity';

const SALT_ROUNDS = 10;

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function seed() {
  await AppDataSource.initialize();
  console.log('Conectado a la base de datos. Iniciando seed...');

  const propietarioRepo = AppDataSource.getRepository(Propietario);
  const adminRepo = AppDataSource.getRepository(Administrador);
  const clienteRepo = AppDataSource.getRepository(Cliente);
  const propertyRepo = AppDataSource.getRepository(Property);
  const imageRepo = AppDataSource.getRepository(PropertyImage);
  const blockedRepo = AppDataSource.getRepository(BlockedPeriod);
  const reservationRepo = AppDataSource.getRepository(Reservation);
  const paymentRepo = AppDataSource.getRepository(Payment);
  const cancellationRepo = AppDataSource.getRepository(Cancellation);

  // 1) Propietario + Administrador titular (bootstrap seguro, via env vars)
  const propietarioNombre = process.env.SEED_PROPIETARIO_NOMBRE || 'Rentify Alquileres S.A.';
  const propietarioDocumento = process.env.SEED_PROPIETARIO_DOCUMENTO || '30-71234567-9';
  const propietarioEmail = process.env.SEED_PROPIETARIO_EMAIL || 'propietario@rentify.local';

  let propietario = await propietarioRepo.findOne({ where: { documento: propietarioDocumento } });
  if (!propietario) {
    propietario = await propietarioRepo.save(
      propietarioRepo.create({
        tipoTitular: TipoTitular.EMPRESA,
        nombre: propietarioNombre,
        documento: propietarioDocumento,
        direccion: 'Av. Siempre Viva 742, Villa Maria, Cordoba',
        telefono: '+54 353 4000000',
        email: propietarioEmail,
      }),
    );
    console.log(`Propietario creado: ${propietario.nombre} (#${propietario.id})`);
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@rentify.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234';
  const adminUsuario = process.env.ADMIN_USERNAME || 'admin';

  let admin = await adminRepo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    admin = await adminRepo.save(
      adminRepo.create({
        propietarioId: propietario.id,
        usuario: adminUsuario,
        email: adminEmail,
        contrasena: await bcrypt.hash(adminPassword, SALT_ROUNDS),
        rol: RolAdministrador.TITULAR,
        activo: true,
      }),
    );
    console.log(`Administrador (titular) creado: ${admin.email} / contrasena: ${adminPassword}`);
  }

  // Un segundo administrador "empleado" para demostrar 1:N Propietario->Administrador
  const empleadoEmail = 'empleado@rentify.local';
  let empleado = await adminRepo.findOne({ where: { email: empleadoEmail } });
  if (!empleado) {
    empleado = await adminRepo.save(
      adminRepo.create({
        propietarioId: propietario.id,
        usuario: 'empleado1',
        email: empleadoEmail,
        contrasena: await bcrypt.hash('Empleado1234', SALT_ROUNDS),
        rol: RolAdministrador.EMPLEADO,
        activo: true,
      }),
    );
    console.log(`Administrador (empleado) creado: ${empleado.email} / contrasena: Empleado1234`);
  }

  // 2) Clientes de ejemplo
  const clientesData = [
    { nombre: 'Abril', apellido: 'Carballo', email: 'abril.cliente@rentify.local' },
    { nombre: 'Valentina', apellido: 'Luna', email: 'valentina.cliente@rentify.local' },
    { nombre: 'Mateo', apellido: 'Manera', email: 'mateo.cliente@rentify.local' },
  ];
  const clientePassword = process.env.SEED_CLIENTE_PASSWORD || 'Cliente1234';
  const clientes: Cliente[] = [];
  for (const c of clientesData) {
    let cliente = await clienteRepo.findOne({ where: { email: c.email } });
    if (!cliente) {
      cliente = await clienteRepo.save(
        clienteRepo.create({
          ...c,
          telefono: '+54 353 4111111',
          fechaNacimiento: '1998-05-10',
          contrasena: await bcrypt.hash(clientePassword, SALT_ROUNDS),
          activo: true,
        }),
      );
      console.log(`Cliente creado: ${cliente.email} / contrasena: ${clientePassword}`);
    }
    clientes.push(cliente);
  }

  // 3) Propiedades de ejemplo
  const propiedadesData = [
    {
      nombre: 'Casa de campo Villa Maria',
      descripcion: 'Amplia casa con parque y pileta, ideal para familias.',
      tipo: PropertyType.CASA,
      direccion: 'Ruta 9, km 545',
      ciudad: 'Villa Maria',
      latitud: -32.4076,
      longitud: -63.2402,
      capacidad: 8,
      precioNoche: 45000,
      porcentajeSena: 30,
      aceptaMascotas: true,
      imagenes: [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      ],
    },
    {
      nombre: 'Cabana del Bosque',
      descripcion: 'Cabana de troncos rodeada de naturaleza, con hogar a lena.',
      tipo: PropertyType.CABANA,
      direccion: 'Camino de las Sierras s/n',
      ciudad: 'La Cumbrecita',
      latitud: -31.8981,
      longitud: -64.7355,
      capacidad: 4,
      precioNoche: 32000,
      porcentajeSena: 40,
      aceptaMascotas: false,
      imagenes: [
        'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200',
        'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1200',
      ],
    },
    {
      nombre: 'Depto Centrico Cordoba',
      descripcion: 'Moderno departamento a pasos del centro, ideal para parejas.',
      tipo: PropertyType.DEPARTAMENTO,
      direccion: 'Av. Colon 1200',
      ciudad: 'Cordoba',
      latitud: -31.4167,
      longitud: -64.1833,
      capacidad: 2,
      precioNoche: 25000,
      porcentajeSena: 25,
      aceptaMascotas: false,
      imagenes: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
      ],
    },
    {
      nombre: 'Quinta con Pileta San Marcos',
      descripcion: 'Quinta amplia con pileta y quincho, para grupos grandes.',
      tipo: PropertyType.QUINTA,
      direccion: 'Camino a las Sierras 450',
      ciudad: 'San Marcos Sierras',
      latitud: -30.7597,
      longitud: -64.5372,
      capacidad: 12,
      precioNoche: 60000,
      porcentajeSena: 30,
      aceptaMascotas: true,
      imagenes: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200',
      ],
    },
  ];

  const propiedades: Property[] = [];
  for (const p of propiedadesData) {
    let property = await propertyRepo.findOne({ where: { nombre: p.nombre } });
    if (!property) {
      property = await propertyRepo.save(
        propertyRepo.create({
          propietarioId: propietario.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          tipo: p.tipo,
          direccion: p.direccion,
          ciudad: p.ciudad,
          latitud: p.latitud,
          longitud: p.longitud,
          capacidad: p.capacidad,
          precioNoche: p.precioNoche,
          porcentajeSena: p.porcentajeSena,
          aceptaMascotas: p.aceptaMascotas,
          aceptaMenores: true,
          limiteMesesReserva: 6,
          estado: PropertyStatus.ACTIVA,
        }),
      );
      for (const [i, url] of p.imagenes.entries()) {
        await imageRepo.save(imageRepo.create({ propertyId: property.id, url, orden: i }));
      }
      console.log(`Propiedad creada: ${property.nombre} (#${property.id})`);
    }
    propiedades.push(property);
  }

  // 4) Periodo bloqueado de ejemplo (mantenimiento) en la primera propiedad
  const existeBloqueo = await blockedRepo.findOne({
    where: { propertyId: propiedades[0].id },
  });
  if (!existeBloqueo) {
    await blockedRepo.save(
      blockedRepo.create({
        propertyId: propiedades[0].id,
        fechaDesde: toDateStr(addDays(new Date(), 40)),
        fechaHasta: toDateStr(addDays(new Date(), 45)),
        motivo: 'Mantenimiento programado de pileta',
      }),
    );
    console.log('Periodo bloqueado de ejemplo creado.');
  }

  // 5) Reservas de ejemplo (confirmada con pago, pendiente, vencida, cancelada)
  const existingReservations = await reservationRepo.count();
  if (existingReservations === 0) {
    // Reserva confirmada con pago aprobado (10 dias en el futuro)
    const r1 = await reservationRepo.save(
      reservationRepo.create({
        propertyId: propiedades[0].id,
        clienteId: clientes[0].id,
        fechaDesde: toDateStr(addDays(new Date(), 10)),
        fechaHasta: toDateStr(addDays(new Date(), 15)),
        noches: 5,
        precioNocheSnapshot: propiedades[0].precioNoche,
        importeTotal: Number(propiedades[0].precioNoche) * 5,
        importeSena:
          (Number(propiedades[0].precioNoche) * 5 * Number(propiedades[0].porcentajeSena)) / 100,
        estado: ReservationStatus.CONFIRMED,
        fechaVencimientoTemporal: null,
      }),
    );
    await paymentRepo.save(
      paymentRepo.create({
        reservationId: r1.id,
        provider: 'mercadopago',
        externalPaymentId: 'DEMO-1000001',
        monto: r1.importeSena,
        estado: PaymentStatus.APPROVED,
        statusDetail: 'accredited',
        paidAt: new Date(),
      }),
    );

    // Reserva pendiente de pago (recien creada)
    await reservationRepo.save(
      reservationRepo.create({
        propertyId: propiedades[1].id,
        clienteId: clientes[1].id,
        fechaDesde: toDateStr(addDays(new Date(), 20)),
        fechaHasta: toDateStr(addDays(new Date(), 23)),
        noches: 3,
        precioNocheSnapshot: propiedades[1].precioNoche,
        importeTotal: Number(propiedades[1].precioNoche) * 3,
        importeSena:
          (Number(propiedades[1].precioNoche) * 3 * Number(propiedades[1].porcentajeSena)) / 100,
        estado: ReservationStatus.PENDING_PAYMENT,
        fechaVencimientoTemporal: addDays(new Date(), 0),
      }),
    );

    // Reserva vencida (ya paso el plazo de pago)
    const vencida = await reservationRepo.save(
      reservationRepo.create({
        propertyId: propiedades[2].id,
        clienteId: clientes[2].id,
        fechaDesde: toDateStr(addDays(new Date(), 30)),
        fechaHasta: toDateStr(addDays(new Date(), 32)),
        noches: 2,
        precioNocheSnapshot: propiedades[2].precioNoche,
        importeTotal: Number(propiedades[2].precioNoche) * 2,
        importeSena:
          (Number(propiedades[2].precioNoche) * 2 * Number(propiedades[2].porcentajeSena)) / 100,
        estado: ReservationStatus.EXPIRED,
        fechaVencimientoTemporal: addDays(new Date(), -1),
      }),
    );

    // Reserva cancelada por el cliente (historica, ya paso)
    const r4 = await reservationRepo.save(
      reservationRepo.create({
        propertyId: propiedades[3].id,
        clienteId: clientes[0].id,
        fechaDesde: toDateStr(addDays(new Date(), 5)),
        fechaHasta: toDateStr(addDays(new Date(), 8)),
        noches: 3,
        precioNocheSnapshot: propiedades[3].precioNoche,
        importeTotal: Number(propiedades[3].precioNoche) * 3,
        importeSena:
          (Number(propiedades[3].precioNoche) * 3 * Number(propiedades[3].porcentajeSena)) / 100,
        estado: ReservationStatus.CANCELLED,
        fechaVencimientoTemporal: null,
      }),
    );
    await cancellationRepo.save(
      cancellationRepo.create({
        reservationId: r4.id,
        tipoUsuario: TipoUsuarioCancelacion.CLIENTE,
        usuarioId: clientes[0].id,
        usuarioNombre: `${clientes[0].nombre} ${clientes[0].apellido}`,
        motivo: 'Cambio de planes de viaje.',
        esExcepcional: false,
        generoReintegro: false,
      }),
    );

    console.log('Reservas de ejemplo creadas (confirmada, pendiente, vencida, cancelada).');
  }

  console.log('\nSeed finalizado correctamente.');
  console.log('----------------------------------------------------');
  console.log(`Administrador (titular): ${adminEmail} / ${adminPassword}`);
  console.log(`Administrador (empleado): ${empleadoEmail} / Empleado1234`);
  console.log(`Clientes de ejemplo: ${clientesData.map((c) => c.email).join(', ')} / ${clientePassword}`);
  console.log('----------------------------------------------------');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Error ejecutando el seed:', err);
  process.exit(1);
});
