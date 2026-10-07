using Lab.Application.Common.Interfaces;
using Lab.Application.DTOs;
using Lab.Domain.Entities;
using Lab.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lab.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TestsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public TestsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<TestCategoryDto>>> GetCategories()
    {
        var list = await _context.TestCategories
            .Include(c => c.Tests)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new TestCategoryDto(
                c.Id,
                c.CategoryCode,
                c.CategoryName,
                c.DisplayOrder,
                c.IsActive,
                c.Tests.Count
            ))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost("categories")]
    public async Task<ActionResult<TestCategoryDto>> CreateCategory([FromBody] CreateTestCategoryDto dto)
    {
        var cat = new TestCategory
        {
            CategoryCode = dto.CategoryCode,
            CategoryName = dto.CategoryName,
            DisplayOrder = dto.DisplayOrder,
            IsActive = true
        };

        await _context.TestCategories.AddAsync(cat);
        await _context.SaveChangesAsync();

        return Ok(new TestCategoryDto(cat.Id, cat.CategoryCode, cat.CategoryName, cat.DisplayOrder, cat.IsActive, 0));
    }

    [HttpGet]
    public async Task<ActionResult<List<TestMasterDto>>> GetTests([FromQuery] string? search, [FromQuery] Guid? categoryId)
    {
        var query = _context.Tests
            .AsNoTracking()
            .Include(t => t.Category)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(t => t.TestName.ToLower().Contains(s) ||
                                     t.TestCode.ToLower().Contains(s) ||
                                     (t.ShortName != null && t.ShortName.ToLower().Contains(s)));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(t => t.CategoryId == categoryId.Value);
        }

        var tests = await query.OrderBy(t => t.TestName).ToListAsync();
        var testIds = tests.Select(t => t.Id).ToList();

        var parameters = await _context.TestParameters
            .AsNoTracking()
            .Where(p => testIds.Contains(p.TestId))
            .OrderBy(p => p.DisplayOrder)
            .ToListAsync();

        var paramIds = parameters.Select(p => p.Id).ToList();

        var normalRanges = await _context.ParameterNormalRanges
            .AsNoTracking()
            .Where(r => paramIds.Contains(r.ParameterId))
            .ToListAsync();

        var rangesByParam = normalRanges
            .GroupBy(r => r.ParameterId)
            .ToDictionary(g => g.Key, g => g.Select(r => new ParameterNormalRangeDto(
                r.Id,
                r.ApplicableGender,
                r.MinAgeDays,
                r.MaxAgeDays,
                r.MinNormalValue,
                r.MaxNormalValue,
                r.PanicLowValue,
                r.PanicHighValue,
                r.TextualRange,
                r.AgeDisplayGroup
            )).ToList());

        var paramsByTest = parameters
            .GroupBy(p => p.TestId)
            .ToDictionary(g => g.Key, g => g.Select(p => new TestParameterDto(
                p.Id,
                p.TestId,
                p.ParameterCode,
                p.ParameterName,
                p.Unit,
                p.InputType,
                p.DefaultValue,
                p.OptionsJson,
                p.FormulaExpression,
                p.DisplayOrder,
                p.IsMandatory,
                rangesByParam.TryGetValue(p.Id, out var ranges) ? ranges : new List<ParameterNormalRangeDto>()
            )).ToList());

        var result = tests.Select(t => new TestMasterDto(
            t.Id,
            t.CategoryId,
            t.Category?.CategoryName ?? "",
            t.TestCode,
            t.TestName,
            t.ShortName,
            t.ItemType,
            t.SampleType,
            t.ContainerVialType,
            t.Price,
            t.CostPrice,
            t.TatHours,
            t.Methodology,
            t.ClinicalSignificance,
            t.PreTestInstructions,
            t.InterpretationTemplate,
            t.IsActive,
            paramsByTest.TryGetValue(t.Id, out var pList) ? pList : new List<TestParameterDto>()
        )).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TestMasterDto>> CreateTest([FromBody] CreateTestMasterDto dto)
    {
        var test = new TestMaster
        {
            CategoryId = dto.CategoryId,
            TestCode = dto.TestCode,
            TestName = dto.TestName,
            ShortName = dto.ShortName,
            ItemType = dto.ItemType,
            SampleType = dto.SampleType,
            ContainerVialType = dto.ContainerVialType,
            Price = dto.Price,
            CostPrice = dto.CostPrice,
            TatHours = dto.TatHours,
            Methodology = dto.Methodology,
            ClinicalSignificance = dto.ClinicalSignificance,
            PreTestInstructions = dto.PreTestInstructions,
            InterpretationTemplate = dto.InterpretationTemplate,
            IsActive = true
        };

        await _context.Tests.AddAsync(test);
        await _context.SaveChangesAsync();

        if (dto.Parameters != null && dto.Parameters.Count > 0)
        {
            foreach (var pDto in dto.Parameters)
            {
                var param = new TestParameter
                {
                    TestId = test.Id,
                    ParameterCode = pDto.ParameterCode,
                    ParameterName = pDto.ParameterName,
                    Unit = pDto.Unit,
                    InputType = pDto.InputType,
                    DefaultValue = pDto.DefaultValue,
                    OptionsJson = pDto.OptionsJson,
                    FormulaExpression = pDto.FormulaExpression,
                    DisplayOrder = pDto.DisplayOrder,
                    IsMandatory = pDto.IsMandatory,
                    IsActive = true
                };
                await _context.TestParameters.AddAsync(param);
                await _context.SaveChangesAsync();

                if (pDto.NormalRanges != null)
                {
                    foreach (var rDto in pDto.NormalRanges)
                    {
                        var range = new ParameterNormalRange
                        {
                            ParameterId = param.Id,
                            ApplicableGender = rDto.ApplicableGender,
                            MinAgeDays = rDto.MinAgeDays,
                            MaxAgeDays = rDto.MaxAgeDays,
                            MinNormalValue = rDto.MinNormalValue,
                            MaxNormalValue = rDto.MaxNormalValue,
                            PanicLowValue = rDto.PanicLowValue,
                            PanicHighValue = rDto.PanicHighValue,
                            TextualRange = rDto.TextualRange,
                            AgeDisplayGroup = rDto.AgeDisplayGroup
                        };
                        await _context.ParameterNormalRanges.AddAsync(range);
                    }
                }
            }
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Test created successfully.", testId = test.Id });
    }

    [HttpPatch("{id}/price")]
    public async Task<IActionResult> UpdateTestPrice(Guid id, [FromBody] UpdateTestPriceDto dto)
    {
        var test = await _context.Tests.FirstOrDefaultAsync(t => t.Id == id);
        if (test == null) return NotFound(new { message = "Test not found." });

        test.Price = dto.Price;
        if (dto.CostPrice.HasValue)
        {
            test.CostPrice = dto.CostPrice.Value;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Price for \"{test.TestName}\" updated to ₹{test.Price}.", price = test.Price, costPrice = test.CostPrice });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTest(Guid id, [FromBody] UpdateTestMasterDto dto)
    {
        var test = await _context.Tests
            .Include(t => t.Parameters)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (test == null) return NotFound(new { message = "Test not found." });

        test.CategoryId = dto.CategoryId;
        test.TestCode = dto.TestCode;
        test.TestName = dto.TestName;
        test.ShortName = dto.ShortName;
        test.ItemType = dto.ItemType;
        test.SampleType = dto.SampleType;
        test.ContainerVialType = dto.ContainerVialType;
        test.Price = dto.Price;
        test.CostPrice = dto.CostPrice;
        test.TatHours = dto.TatHours;
        test.Methodology = dto.Methodology;
        test.ClinicalSignificance = dto.ClinicalSignificance;
        test.PreTestInstructions = dto.PreTestInstructions;
        test.InterpretationTemplate = dto.InterpretationTemplate;
        test.IsActive = dto.IsActive;

        if (dto.Parameters != null && dto.Parameters.Any())
        {
            var oldParamIds = test.Parameters.Select(p => p.Id).ToList();
            var oldRanges = await _context.ParameterNormalRanges.Where(r => oldParamIds.Contains(r.ParameterId)).ToListAsync();
            _context.ParameterNormalRanges.RemoveRange(oldRanges);
            _context.TestParameters.RemoveRange(test.Parameters);
            await _context.SaveChangesAsync();

            foreach (var pDto in dto.Parameters)
            {
                var param = new TestParameter
                {
                    TestId = test.Id,
                    ParameterCode = pDto.ParameterCode,
                    ParameterName = pDto.ParameterName,
                    Unit = pDto.Unit,
                    InputType = pDto.InputType,
                    DefaultValue = pDto.DefaultValue,
                    OptionsJson = pDto.OptionsJson,
                    FormulaExpression = pDto.FormulaExpression,
                    DisplayOrder = pDto.DisplayOrder,
                    IsMandatory = pDto.IsMandatory,
                    IsActive = true
                };
                await _context.TestParameters.AddAsync(param);
                await _context.SaveChangesAsync();

                if (pDto.NormalRanges != null)
                {
                    foreach (var rDto in pDto.NormalRanges)
                    {
                        var range = new ParameterNormalRange
                        {
                            ParameterId = param.Id,
                            ApplicableGender = rDto.ApplicableGender,
                            MinAgeDays = rDto.MinAgeDays,
                            MaxAgeDays = rDto.MaxAgeDays,
                            MinNormalValue = rDto.MinNormalValue,
                            MaxNormalValue = rDto.MaxNormalValue,
                            PanicLowValue = rDto.PanicLowValue,
                            PanicHighValue = rDto.PanicHighValue,
                            TextualRange = rDto.TextualRange,
                            AgeDisplayGroup = rDto.AgeDisplayGroup
                        };
                        await _context.ParameterNormalRanges.AddAsync(range);
                    }
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Investigation \"{test.TestName}\" updated successfully." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTest(Guid id)
    {
        var test = await _context.Tests
            .Include(t => t.Parameters)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (test == null) return NotFound(new { message = "Test not found." });

        var isUsed = await _context.CaseOrderItems.AnyAsync(i => i.TestId == id);
        if (isUsed)
        {
            test.IsActive = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Investigation \"{test.TestName}\" has existing patient cases and was deactivated." });
        }

        var paramIds = test.Parameters.Select(p => p.Id).ToList();
        var ranges = await _context.ParameterNormalRanges.Where(r => paramIds.Contains(r.ParameterId)).ToListAsync();
        _context.ParameterNormalRanges.RemoveRange(ranges);
        _context.TestParameters.RemoveRange(test.Parameters);
        _context.Tests.Remove(test);

        await _context.SaveChangesAsync();
        return Ok(new { message = $"Investigation \"{test.TestName}\" deleted successfully." });
    }
}
