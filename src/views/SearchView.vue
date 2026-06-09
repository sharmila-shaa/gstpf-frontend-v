<script setup>
import { computed, ref } from "vue";
import { searchGSTPractitioners } from "../services/api";

const pincode = ref("");
const records = ref([]);

const isLoading = ref(false);
const errorMessage = ref("");
const hasSearched = ref(false);

const hasRecords = computed(() => {
  return records.value.length > 0;
});

function normalizeRecords(response) {
  const possibleRecords =
    response?.data?.data ||
    response?.data?.records ||
    response?.data ||
    response?.records ||
    response?.result ||
    response;

  return Array.isArray(possibleRecords) ? possibleRecords : [];
}

function getEnrollmentNumber(record) {
  return (
    record.enrollment_no ||
    record.enrollmentNo ||
    record.enrlNo ||
    "-"
  );
}

function getName(record) {
  return record.name || record.trpNam || "-";
}

function getPincode(record) {
  return (
    record.pincode ||
    record.pinCode ||
    record.pinCd ||
    record.pnCd ||
    record.adrs?.pinCode ||
    "-"
  );
}

function getMobile(record) {
  return (
    record.mobile_no ||
    record.mobileNo ||
    record.mbNo ||
    record.cntctNo ||
    "-"
  );
}

function getEmail(record) {
  return record.email_id || record.emailId || "-";
}

function getAddress(record) {
  if (typeof record.address === "string") {
    return record.address;
  }

  if (typeof record.adr === "string") {
    return record.adr;
  }

  if (record.adrs && typeof record.adrs === "object") {
    return Object.values(record.adrs)
      .filter(Boolean)
      .join(", ");
  }

  return "-";
}

async function submitSearch() {
  errorMessage.value = "";
  records.value = [];
  hasSearched.value = true;

  const cleanPincode = pincode.value.trim();

  if (!/^\d{6}$/.test(cleanPincode)) {
    errorMessage.value = "Please enter a valid six-digit pincode.";
    return;
  }

  try {
    isLoading.value = true;

    const response = await searchGSTPractitioners(cleanPincode);

    records.value = normalizeRecords(response);
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}

function exportCSV() {
  if (!records.value.length) {
    return;
  }

  const headings = [
    "Enrollment Number",
    "Name",
    "Pincode",
    "Mobile Number",
    "Email",
    "Address",
    "State",
    "District", 
    "Status",
  ];

  const rows = records.value.map((record) => [
    getEnrollmentNumber(record),
    getName(record),
    getPincode(record),
    getMobile(record),
    getEmail(record),
    getAddress(record),
    getState(record),
    getDistrict(record),
    getStatus(record),
  ]);

  const csv = [headings, ...rows]
    .map((row) =>
      row
        .map((value) => {
          const safeValue = String(value ?? "").replace(/"/g, '""');
          return `"${safeValue}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `gst-practitioners-${pincode.value}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
</script>

<template>
  <section class="container py-5">
    <div class="d-flex flex-wrap justify-content-between gap-3 mb-4">
      <div>
        <h2>Locate GST Practitioners</h2>
        <p class="text-muted mb-0">
          Enter a six-digit Indian pincode to search for practitioners.
        </p>
      </div>

      <button
        v-if="hasRecords"
        class="btn btn-success align-self-start"
        type="button"
        @click="exportCSV"
      >
        Export CSV
      </button>
    </div>

    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <form
          class="row g-3"
          @submit.prevent="submitSearch"
        >
          <div class="col-md-8">
            <label class="form-label">Pincode</label>

            <input
              v-model="pincode"
              class="form-control"
              type="text"
              maxlength="6"
              placeholder="Example: 600001"
            />
          </div>

          <div class="col-md-4 d-flex align-items-end">
            <button
              class="btn btn-primary w-100"
              type="submit"
              :disabled="isLoading"
            >
              {{ isLoading ? "Searching..." : "Search" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="alert alert-danger"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="isLoading"
      class="text-center py-4"
    >
      <div class="spinner-border" role="status"></div>
      <p class="mt-2">Loading GST Practitioner records...</p>
    </div>

    <div
      v-else-if="hasRecords"
      class="table-responsive"
    >
      <table class="table table-bordered table-striped align-middle">
        <thead class="table-dark">
          <tr>
            <th>Enrollment Number</th>
            <th>Name</th>
            <th>Pincode</th>
            <th>Mobile Number</th>
            <th>Email</th>
            <th>Address</th>
            <th>State</th>
            <th>District</th>
            <th>status</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(record, index) in records"
            :key="record.id || getEnrollmentNumber(record) || index"
          >
            <td>{{ getEnrollmentNumber(record) }}</td>
            <td>{{ getName(record) }}</td>
            <td>{{ getPincode(record) }}</td>
            <td>{{ getMobile(record) }}</td>
            <td>{{ getEmail(record) }}</td>
            <td>{{ getAddress(record) }}</td>
            <td>{{ getState(record) }}</td>
            <td>{{ getDistrict(record) }}</td>
            <td>{{ getStatus(record) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="hasSearched && !isLoading"
      class="alert alert-info"
    >
      No GST Practitioners were found for this pincode.
    </div>
  </section>
</template>