We wish to be able to dynamically extract data from a webpage object.

> The webpage object is represented using JSDOM.

We define a framework of extractors using a typescript interface.

We implement a pair of basic extractors:
- extract by class name 
- extract tag property

To implement this framework, we need to have a clean representation 
of the data that we wish to extract.

> The output data format should be specified by the user.

The user should be able to specify the JS string,
furthermore named the Query String.

The QS should be used as a flatmap function for the extracted data.
The extracted data should be returned in JSON format.