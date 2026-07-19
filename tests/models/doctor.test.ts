import { expect, test, describe } from 'vitest';
import mongoose from 'mongoose';
import { Doctor, ConsultationMode } from '../../src/models/Doctor';

describe('Doctor Model Test', () => {
  test('should create and save doctor successfully', async () => {
    const validDoctor = new Doctor({
      name: 'Dr. Jane Smith',
      specialty: 'Cardiology',
      location: 'New York',
    });
    
    const savedDoctor = await validDoctor.save();
    
    expect(savedDoctor._id).toBeDefined();
    expect(savedDoctor.name).toBe('Dr. Jane Smith');
    expect(savedDoctor.specialty).toBe('Cardiology');
    expect(savedDoctor.location).toBe('New York');
    expect(savedDoctor.consultationMode).toBe(ConsultationMode.InPerson); // Default value
    expect(savedDoctor.verified).toBe(false); // Default value
  });

  test('should fail to save doctor without required fields', async () => {
    const doctorWithoutRequiredField = new Doctor({ name: 'Dr. John Doe' });
    let err;
    try {
      await doctorWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.specialty).toBeDefined();
    expect(err.errors.location).toBeDefined();
  });
});
