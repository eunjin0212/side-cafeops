import { useState } from 'react';

import { can, canScoreEmployee } from '@/constants/permissions';
import { useCreateScoreEntry } from '@/hooks/useCreateScoreEntry';
import { useEmployees } from '@/hooks/useEmployees';
import { useLocations } from '@/hooks/useLocations';
import { usePermissionGate } from '@/hooks/usePermissionGate';
import { useScoreCategories } from '@/hooks/useScoreCategories';
import { ScoreSection } from '@/types/score';

// All of the score entry screen's state and rules, so the screen and its
// pickers only have to render.
export function useScoreEntryForm(preselectedId: string | undefined) {
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(
    preselectedId ? [preselectedId] : [],
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<ScoreSection>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  const { profile: currentProfile, isLoading: profileLoading } = usePermissionGate(
    'manageScores',
    '/',
  );
  const { employees, isLoading: employeesLoading } = useEmployees();
  const { categories, isLoading: categoriesLoading } = useScoreCategories();
  const { locations: allLocations } = useLocations();
  const { mutate, isPending, error, reset: resetMutation } = useCreateScoreEntry();

  // GM/owner may score employees across every location, mirroring the
  // leaderboard/home screens; everyone else may only switch between the
  // locations they themselves work at.
  const canBrowseAllLocations =
    currentProfile !== null && can(currentProfile.role, 'browseAllLocations');
  const scoringLocations = canBrowseAllLocations ? allLocations : (currentProfile?.locations ?? []);

  // Arriving from an employee's detail page ("Score" button) preselects
  // that employee — also auto-pick whichever of their locations the actor
  // can score at (their primary one, if that's in scope), so a
  // multi-location actor doesn't have to re-derive it manually.
  const preselectedEmployee = preselectedId
    ? employees.find((e) => e.id === preselectedId)
    : undefined;
  const scoringLocationIds = new Set(scoringLocations.map((l) => l.id));
  const eligiblePreselectedLocations = preselectedEmployee
    ? preselectedEmployee.locations.filter(
        (l) => l.isActive && scoringLocationIds.has(l.locationId),
      )
    : [];
  const preselectedEmployeeLocationId = (
    eligiblePreselectedLocations.find((l) => l.isPrimary) ?? eligiblePreselectedLocations[0]
  )?.locationId;

  const effectiveLocationId =
    selectedLocationId ??
    (scoringLocations.length === 1 ? scoringLocations[0].id : preselectedEmployeeLocationId);

  const scorableEmployees = effectiveLocationId
    ? employees.filter(
        (e) =>
          e.isActive &&
          e.id !== currentProfile?.id &&
          (currentProfile === null || canScoreEmployee(currentProfile.role, e.role)) &&
          e.locations.some((l) => l.isActive && l.locationId === effectiveLocationId),
      )
    : [];

  const searchResults =
    employeeSearch.trim().length > 0
      ? scorableEmployees.filter((e) =>
          (e.fullName ?? e.email).toLowerCase().includes(employeeSearch.toLowerCase()),
        )
      : [];

  const selectedEmployees = scorableEmployees.filter((e) => selectedProfileIds.includes(e.id));

  const activeCategories = categories.filter((c) => c.isActive);
  const selectedCategories = activeCategories.filter((c) => selectedCategoryIds.includes(c.id));
  const totalPoints = selectedCategories.reduce((sum, c) => sum + c.points, 0);
  const totalEntries = selectedProfileIds.length * selectedCategoryIds.length;

  const canSubmit =
    effectiveLocationId !== undefined &&
    selectedProfileIds.length > 0 &&
    selectedCategoryIds.length > 0 &&
    !isPending &&
    !submitted;

  function toggleEmployee(id: string): void {
    setSelectedProfileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleCategory(id: string): void {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleSection(section: ScoreSection): void {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  function addImage(uri: string): void {
    setImageUris((prev) => [...prev, uri]);
  }

  function removeImage(index: number): void {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  }

  function submit(): void {
    if (!canSubmit || !effectiveLocationId) return;
    mutate(
      {
        profiles: selectedEmployees.map((emp) => ({
          profileId: emp.id,
          locationId: effectiveLocationId,
        })),
        selections: selectedCategories.map((c) => ({
          categoryId: c.id,
          points: c.points,
        })),
        notes: notes.trim() || undefined,
        imageUris: imageUris.length > 0 ? imageUris : undefined,
      },
      {
        onSuccess: () => {
          // Location stays selected — a supervisor typically scores
          // several employees at the same location in one sitting.
          setSelectedProfileIds([]);
          setEmployeeSearch('');
          setSelectedCategoryIds([]);
          setExpandedSections(new Set());
          setNotes('');
          setImageUris([]);
          setSubmittedCount(totalEntries);
          setSubmitted(true);
          setTimeout(() => {
            setSubmitted(false);
            resetMutation();
          }, 2500);
        },
      },
    );
  }

  const submitLabel = submitted
    ? `✓ ${submittedCount} ${submittedCount === 1 ? 'entry' : 'entries'} submitted`
    : !effectiveLocationId
      ? 'Select a location'
      : selectedProfileIds.length === 0
        ? 'Select employees'
        : selectedCategoryIds.length === 0
          ? 'Select categories'
          : `Submit — ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'}`;

  return {
    profileLoading,
    scoringLocations,
    effectiveLocationId,
    selectLocation: setSelectedLocationId,
    employeesLoading,
    employeeSearch,
    setEmployeeSearch,
    searchResults,
    selectedEmployees,
    selectedProfileIds,
    toggleEmployee,
    categoriesLoading,
    activeCategories,
    selectedCategoryIds,
    toggleCategory,
    expandedSections,
    toggleSection,
    notes,
    setNotes,
    imageUris,
    addImage,
    removeImage,
    totalPoints,
    canSubmit,
    isPending,
    error,
    submitted,
    submitLabel,
    submit,
  };
}
