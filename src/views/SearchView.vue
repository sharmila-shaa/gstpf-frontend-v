<script setup>
import { computed, ref } from "vue";
import { searchGSTPractitioners } from "../services/api";

const pincode = ref("");
const name = ref("");
const state = ref("");
const district = ref("");
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
  ];

  const rows = records.value.map((record) => [
    getEnrollmentNumber(record),
    getName(record),
    getPincode(record),
    getMobile(record),
    getEmail(record),
    getAddress(record),
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
    <div class="search-area mb-4">
        <form class="gst-search-form" @submit.prevent="submitSearch">
  <div class="row align-items-end g-4">
    <div class="col-md-3">
      <label class="form-label">Name</label>
      <input
        v-model="name"
        class="form-control gst-input"
        type="text"
        placeholder="Enter name of GSTP"
      />
    </div>

    <div class="col-md-3">
      <label class="form-label">
        State <span class="text-danger">*</span>
      </label>
      <select v-model="state" class="form-select gst-input">
        <option value="">Select</option>
        <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
        <option value="Andhra Pradesh">Andhra Pradesh</option>
        <option value="Arunachal Pradesh">Arunachal Pradesh</option>
        <option value="Assam">Assam</option>
        <option value="Bihar">Bihar</option>
        <option value="Chhattisgarh">Chhattisgarh</option>
        <option value="Goa">Goa</option>
        <option value="Gujarat">Gujarat</option>
        <option value="Haryana">Haryana</option>
        <option value="Himachal Pradesh">Himachal Pradesh</option>
        <option value="Jharkhand">Jharkhand</option>
        <option value="Karnataka">Karnataka</option>
        <option value="Kerala">Kerala</option>
        <option value="Madhya Pradesh">Madhya Pradesh</option>
        <option value="Maharashtra">Maharashtra</option>
        <option value="Manipur">Manipur</option>
        <option value="Meghalaya">Meghalaya</option>
        <option value="Mizoram">Mizoram</option>
        <option value="Nagaland">Nagaland</option>
        <option value="Odisha">Odisha</option>
        <option value="puducherry">Puducherry</option>
        <option value="Punjab">Punjab</option>
        <option value="Rajasthan">Rajasthan</option>
        <option value="Sikkim">Sikkim</option>
        <option value="Tamil Nadu">Tamil Nadu</option>
        <option value="Telangana">Telangana</option>
        <option value="Tripura">Tripura</option>
        <option value="Uttar Pradesh">Uttar Pradesh</option>
        <option value="Uttarakhand">Uttarakhand</option>
        <option value="West Bengal">West Bengal</option>  
      </select>
    </div>

    <div class="col-md-3">
      <label class="form-label">District</label>
      <select v-model="district" class="form-select gst-input">
        <option value="">Select</option>
        <option value="Chennai">Chennai</option>
        
      </select>
    </div>

    <div class="col-md-3">
      <label class="form-label">Pincode</label>
      <input
        v-model="pincode"
        class="form-control gst-input"
        type="text"
        maxlength="6"
        placeholder="Enter Pincode"
      />
    </div>
  </div>

  <div class="text-end mt-5">
    <button
      class="btn gst-search-btn"
      type="submit"
      :disabled="isLoading"
    >
      {{ isLoading ? "SEARCHING..." : "SEARCH" }}
    </button>
  </div>
</form>
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
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="hasSearched && !isLoading && !errorMessage"
      class="alert alert-info"
    >
      No GST Practitioners were found for this pincode.
    </div>
  </section>
</template>