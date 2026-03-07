# Source notes

This file tracks candidate upstream sources for psychometric content and the constraints around using them.

## Beck Depression Inventory

Status: implemented as the first interactive test under an explicit project assumption that the validated Ukrainian BDI-I translation is licensed for public reuse.

### What is currently clear

- BDI-II is commercially licensed and not free.
- BDI-II questionnaire text should not be assumed reusable for an OSS static site.
- A Ukrainian validation paper for BDI-I exists and is a strong reference for terminology, item ordering, and psychometric context.
- That paper explicitly says later Beck editions have copyright restrictions and explains why Ukrainian researchers often use the first edition instead.

### Working product implication

Under the current project assumption, Beck is now used as:

- the first public interactive test in the app
- a reference instrument for refining the data model and scoring UX

The remaining caveat is textual provenance:

- the validated paper supports the Ukrainian BDI-I as an instrument
- the exact wording imported into the app should be treated as the currently adopted project text and may later be aligned more strictly to the expert-approved Form A / Form B wording if needed

## Best current references

1. Ukrainian BDI-I validation paper
   - URL: https://eprints.oa.edu.ua/id/eprint/9577/
   - PDF: https://eprints.oa.edu.ua/id/eprint/9577/1/BEKA.pdf
   - Notes:
     - Open-access article.
     - Reports psychometric properties of a Ukrainian BDI-I version.
     - Mentions separate Form A and Form B due grammar/expression differences in some items.
     - Lists item names and discusses translation/validation decisions.
     - The article itself is usable as a scholarly reference, but that does not by itself grant questionnaire publication rights for the instrument text.

2. MozOk.ua questionnaire page
   - URL: https://mozok.ua/depressiya/testy/item/2701-shkala-depres-beka
   - Notes:
     - Contains a complete Ukrainian online rendering of the 21 BDI items and score ranges.
     - Used as the practical source for the first interactive JSON definition.
     - The site attributes the version to the adaptation by M. V. Tarabrina.

3. Shirley Ryan AbilityLab RehabMeasures entry
   - URL: https://www.sralab.org/rehabilitation-measures/beck-depression-inventory
   - Notes:
     - Marks BDI-II as `Not Free`.
     - Shows commercial kit pricing and a copyright notice.
     - Good source for confirming that the modern Beck inventory is not an OSS-friendly default.

4. UW Addiction Research Center reference page
   - URL: https://arc.psych.wisc.edu/self-report/beck-depression-inventory-bdi/
   - Notes:
     - Explicitly states the measure is copyrighted and that they do not have authority to grant permission.
     - Useful for general scoring ranges and historical reference only.

## Extracted Beck-specific details worth keeping

- Inventory size: 21 items.
- Answer scale: each item is scored from 0 to 3.
- Classic total score range: 0 to 63.
- Common historical cutoffs cited by UW:
  - 0-9 minimal
  - 10-18 mild
  - 19-29 moderate
  - 30-63 severe

## Ukrainian BDI-I paper details worth keeping

- The paper states BDI-II rights were restrictive and expensive for Ukrainian adaptation work.
- The paper states researchers therefore relied on the first edition for Ukrainian use.
- The validated Ukrainian BDI-I item labels listed in the paper are:
  1. Сум
  2. Песимізм
  3. Поразки минулого
  4. Втрата задоволення
  5. Почуття провини
  6. Очікування покарання
  7. Негативне ставлення до себе
  8. Самокритичність
  9. Думки про самогубство
  10. Плач
  11. Занепокоєння фіз. здоров'ям
  12. Втрата інтересу до людей
  13. Нерішучість
  14. Невдоволеність виглядом
  15. Нездатність працювати
  16. Погіршення сну
  17. Дратівливість
  18. Погіршення апетиту
  19. Зниження ваги
  20. Втома
  21. Зниження інтересу до сексу

## Recommended next step for Beck

- Keep provenance metadata with the test JSON and preserve the license assumption explicitly in the repo.
- If the psychologist body provides the exact validated Form A / Form B wording, replace the current wording with that text and extend the schema to support gendered form selection where needed.
- Use Beck as the baseline example for future test-import workflow and editorial review.
