const Reservation = require("./schema/reservation");

describe("fetch", () => {
  let reservations;

  beforeAll(() => {
    jest.mock("./reservations");
    reservations = require("./reservations");
  });

  afterAll(() => {
    jest.unmock("./reservations");
  });

  it("should be mocked and not create a database record", () => {
    expect(reservations.fetch()).toBeUndefined();
  });
});

describe("save", () => {
  let reservations;

  const mockDebug = jest.fn();
  const mockInsert = jest.fn().mockResolvedValue([1]);

  beforeAll(() => {
    jest.mock("debug", () => () => mockDebug);
    jest.mock("./knex", () => () => ({
      insert: mockInsert,
    }));

    reservations = require("./reservations");
  });

  afterAll(() => {
    jest.unmock("debug");
    jest.unmock("./knex");
  });

  it("should resolve with id upon success", async () => {
    const value = { foo: "bar" };
    const expected = [1];

    const actual = await reservations.save(value);

    expect(actual).toStrictEqual(expected);
    expect(mockDebug).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(value);
  });
});

describe("validate", () => {
  let reservations;

  beforeAll(() => {
    reservations = require("./reservations");
  });

  it("should resolve with no optional fields", () => {
    const reservation = new Reservation({
      date: "2017/06/10",
      time: "06:02 AM",
      party: 4,
      name: "family",
      email: "username@example.com",
    });

    return reservations
      .validate(reservation)
      .then((value) => expect(value).toEqual(reservation));
  });

  //same test with async/await

  it("should resolve with no optional fields", async () => {
    const reservation = new Reservation({
      date: "2017/06/10",
      time: "06:02 AM",
      party: 4,
      name: "family",
      email: "username@example.com",
    });

    await expect(reservations.validate(reservation)).resolves.toEqual(
      reservation
    );
  });

  it("should reject with an invalid email", () => {
    const reservation = new Reservation({
      date: "2017/06/10",
      time: "06:02 AM",
      party: 4,
      name: "family",
      email: "username.example.com",
    });

    expect.assertions(1);

    return reservations
      .validate(reservation)
      .catch((error) => expect(error).toBeInstanceOf(Error));
  });

  // same test with async/await

  it("should reject with an invalid email", async () => {
    const reservation = new Reservation({
      date: "2017/06/10",
      time: "06:02 AM",
      party: 4,
      name: "family",
      email: "username.example.com",
    });

    await expect(reservations.validate(reservation)).rejects.toBeInstanceOf(
      Error
    );
  });

  it("should be called and reject empty input", async () => {
    const mock = jest.spyOn(reservations, "validate");
    const value = undefined;

    await expect(reservations.validate(value)).rejects.toThrow(
      "Cannot read properties of undefined (reading 'validate')"
    );

    expect(mock).toHaveBeenCalledWith(value);

    mock.mockRestore();
  });
});

describe("create", () => {
  let reservations;

  beforeAll(() => {
    reservations = require("./reservations");
  });

  it("should reject if validation fails", async () => {
    //store original function
    const originalMethod = reservations.validate;

    const error = new Error("fail");

    // Mock the function
    reservations.validate = jest.fn(() => Promise.reject(error));

    await expect(reservations.create()).rejects.toBe(error);

    expect(reservations.validate).toHaveBeenCalledTimes(1);

    // Restore
    reservations.validate = originalMethod;
  });

  it("should reject if validation fails using spyOn", async () => {
    const mock = jest.spyOn(reservations, "validate");

    const error = new Error("fail");

    mock.mockImplementation(() => Promise.reject(error));

    const value = "puppy";

    await expect(reservations.create(value)).rejects.toEqual(error);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(value);

    // Restore
    mock.mockRestore();
  });
});
