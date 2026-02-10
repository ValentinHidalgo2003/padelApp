from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, time, timedelta
from apps.users.models import User
from apps.courts.models import Court
from apps.bookings.models import Booking, BookingClosure
from apps.products.models import Product, Consumption


class Command(BaseCommand):
    help = 'Seed database with initial data for development'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting data seeding...'))
        
        # Create users
        self.stdout.write('Creating users...')
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@padelapp.com',
                'first_name': 'Admin',
                'last_name': 'Sistema',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'  Created admin user: admin / admin123'))
        
        reception_user, created = User.objects.get_or_create(
            username='recepcion',
            defaults={
                'email': 'recepcion@padelapp.com',
                'first_name': 'María',
                'last_name': 'González',
                'role': 'reception',
                'phone': '11 5555-1234',
            }
        )
        if created:
            reception_user.set_password('recepcion123')
            reception_user.save()
            self.stdout.write(self.style.SUCCESS(f'  Created reception user: recepcion / recepcion123'))
        
        # Create courts
        self.stdout.write('Creating courts...')
        courts_data = [
            {'name': 'Cancha 1', 'court_type': 'outdoor', 'is_active': True},
            {'name': 'Cancha 2', 'court_type': 'outdoor', 'is_active': True},
            {'name': 'Cancha 3', 'court_type': 'indoor', 'is_active': True},
            {'name': 'Cancha 4', 'court_type': 'glass', 'is_active': True},
        ]
        courts = []
        for court_data in courts_data:
            court, created = Court.objects.get_or_create(
                name=court_data['name'],
                defaults=court_data
            )
            courts.append(court)
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created court: {court.name}'))
        
        # Create products
        self.stdout.write('Creating products...')
        products_data = [
            {'name': 'Agua Mineral 500ml', 'category': 'beverage', 'price': 1500.00, 'stock': 50},
            {'name': 'Gaseosa 500ml', 'category': 'beverage', 'price': 1800.00, 'stock': 40},
            {'name': 'Cerveza Quilmes', 'category': 'beverage', 'price': 2500.00, 'stock': 30},
            {'name': 'Gatorade', 'category': 'beverage', 'price': 2200.00, 'stock': 25},
            {'name': 'Papas Fritas', 'category': 'snack', 'price': 1200.00, 'stock': 20},
            {'name': 'Maní Salado', 'category': 'snack', 'price': 1000.00, 'stock': 15},
            {'name': 'Chocolate', 'category': 'snack', 'price': 1500.00, 'stock': 10},
            {'name': 'Alquiler Paleta', 'category': 'equipment', 'price': 5000.00, 'stock': None},
            {'name': 'Pelota Head', 'category': 'equipment', 'price': 8000.00, 'stock': 5},
        ]
        products = []
        for product_data in products_data:
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                defaults=product_data
            )
            products.append(product)
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created product: {product.name}'))
        
        # Create bookings for today and tomorrow
        self.stdout.write('Creating bookings...')
        today = date.today()
        tomorrow = today + timedelta(days=1)
        
        bookings_data = [
            # Today
            {
                'court': courts[0],
                'date': today,
                'start_time': time(10, 0),
                'end_time': time(11, 30),
                'status': 'completed',
                'customer_name': 'Juan Pérez',
                'customer_phone': '11 5555-0001',
                'created_by': reception_user,
            },
            {
                'court': courts[1],
                'date': today,
                'start_time': time(10, 0),
                'end_time': time(11, 30),
                'status': 'reserved',
                'customer_name': 'María López',
                'customer_phone': '11 5555-0002',
                'created_by': reception_user,
            },
            {
                'court': courts[0],
                'date': today,
                'start_time': time(12, 0),
                'end_time': time(13, 30),
                'status': 'reserved',
                'customer_name': 'Carlos Rodríguez',
                'customer_phone': '11 5555-0003',
                'created_by': reception_user,
            },
            {
                'court': courts[2],
                'date': today,
                'start_time': time(15, 0),
                'end_time': time(16, 30),
                'status': 'completed',
                'customer_name': 'Ana Martínez',
                'customer_phone': '11 5555-0004',
                'created_by': reception_user,
            },
            # Tomorrow
            {
                'court': courts[0],
                'date': tomorrow,
                'start_time': time(9, 0),
                'end_time': time(10, 30),
                'status': 'reserved',
                'customer_name': 'Diego Fernández',
                'customer_phone': '11 5555-0005',
                'created_by': reception_user,
            },
            {
                'court': courts[1],
                'date': tomorrow,
                'start_time': time(11, 0),
                'end_time': time(12, 30),
                'status': 'reserved',
                'customer_name': 'Laura Sánchez',
                'customer_phone': '11 5555-0006',
                'created_by': reception_user,
            },
            {
                'court': courts[3],
                'date': tomorrow,
                'start_time': time(18, 0),
                'end_time': time(19, 30),
                'status': 'reserved',
                'customer_name': 'Roberto García',
                'customer_phone': '11 5555-0007',
                'created_by': reception_user,
            },
        ]
        
        for booking_data in bookings_data:
            booking, created = Booking.objects.get_or_create(
                court=booking_data['court'],
                date=booking_data['date'],
                start_time=booking_data['start_time'],
                defaults=booking_data
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'  Created booking: {booking.court.name} - {booking.date} {booking.start_time}'
                ))
                
                # Add closures and consumptions to completed bookings
                if booking.status == 'completed':
                    # Add consumptions
                    consumption1 = Consumption.objects.create(
                        booking=booking,
                        product=products[0],  # Agua
                        quantity=2,
                        unit_price=products[0].price
                    )
                    consumption2 = Consumption.objects.create(
                        booking=booking,
                        product=products[4],  # Papas
                        quantity=1,
                        unit_price=products[4].price
                    )
                    
                    # Create closure
                    consumptions_total = consumption1.total_price + consumption2.total_price
                    closure = BookingClosure.objects.create(
                        booking=booking,
                        payment_method='cash',
                        booking_amount=15000.00,
                        consumptions_amount=consumptions_total,
                        closed_by=reception_user
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f'    Added closure and consumptions'
                    ))
        
        self.stdout.write(self.style.SUCCESS('\nData seeding completed!'))
        self.stdout.write(self.style.SUCCESS('\nLogin credentials:'))
        self.stdout.write(self.style.SUCCESS('  Admin: admin / admin123'))
        self.stdout.write(self.style.SUCCESS('  Reception: recepcion / recepcion123'))
