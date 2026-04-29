using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TurnoYa.Core.Entities;
using TurnoYa.Core.Interfaces;
using TurnoYa.Infrastructure.Data;

namespace TurnoYa.Infrastructure.Repositories;

public class BusinessValidationRepository : IBusinessValidationRepository
{
    private readonly ApplicationDbContext _context;

    public BusinessValidationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BusinessValidation> CreateAsync(BusinessValidation validation)
    {
        _context.BusinessValidations.Add(validation);
        await _context.SaveChangesAsync();
        return validation;
    }

    public async Task<IEnumerable<BusinessValidation>> GetByAppointmentIdAsync(Guid appointmentId)
    {
        return await _context.BusinessValidations
            .Where(v => v.AppointmentId == appointmentId)
            .ToListAsync();
    }

    public async Task<IEnumerable<BusinessValidation>> GetByBusinessIdAsync(Guid businessId)
    {
        return await _context.BusinessValidations
            .Include(v => v.User)
            .Where(v => v.BusinessId == businessId)
            .ToListAsync();
    }

    public async Task<BusinessValidation?> GetByIdAsync(Guid id)
    {
        return await _context.BusinessValidations
            .Include(v => v.Business)
            .Include(v => v.User)
            .Include(v => v.Appointment)
            .FirstOrDefaultAsync(v => v.Id == id);
    }
}